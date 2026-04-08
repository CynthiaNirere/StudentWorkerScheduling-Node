import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

const User         = db.user;
const Session      = db.session;
const BusinessArea = db.businessArea;

const google_id = process.env.CLIENT_ID;

const exports = {};

exports.login = async (req, res) => {
  console.log("=== LOGIN REQUEST ===");

  try {
    const googleToken = req.body.credential;
    if (!googleToken) return res.status(400).send({ message: "No credential provided" });

    const client     = new OAuth2Client(google_id);
    const ticket     = await client.verifyIdToken({ idToken: googleToken, audience: google_id });
    const googleUser = ticket.getPayload();

    let email     = googleUser.email;
    let firstName = googleUser.given_name;
    let lastName  = googleUser.family_name;

    // Fallback to access token if profile incomplete
    if ((!email || !firstName || !lastName) && req.body.accessToken) {
      const oauth2Client = new OAuth2Client(google_id);
      oauth2Client.setCredentials({ access_token: req.body.accessToken });
      const oauth2   = google.oauth2({ auth: oauth2Client, version: "v2" });
      const { data } = await oauth2.userinfo.get();
      email     = email     || data.email;
      firstName = firstName || data.given_name;
      lastName  = lastName  || data.family_name;
    }

    const now = Date.now();

    // ── Find existing user by email ────────────────────────────────────
    console.log(`🔍 Looking for user with email: ${email}`);
    let user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`👤 GUEST USER detected: ${email}`);
      
      // Create session for guest
      const guestToken = jwt.sign(
        { email, isGuest: true }, 
        authconfig.secret, 
        { expiresIn: 86400 }
      );
      const expiresAt = now + 86400 * 1000;

      await Session.create({
        token: guestToken,
        userId: null, // No user_id for guests
        createdAt: now,
        isActive: 1,
        expiresAt: expiresAt,
      });

      console.log("✅ Guest session created for:", email);
      
      return res.send({
        userId: null,
        user_id: null,
        email: email,
        fName: firstName,
        lName: lastName,
        first_name: firstName,
        last_name: lastName,
        role: 'guest',
        isGuest: true,
        work_location: null,
        token: guestToken,
        message: "Guest login - not registered in system"
      });
    }

    // ✅ REGISTERED USER FOUND
    console.log(`✅ Found registered user:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      fName: user.fName,
      lName: user.lName,
      work_location: user.work_location
    });

    const nameChanged = user.fName !== firstName || user.lName !== lastName;
    if (nameChanged) {
      console.log(`📝 Updating user name from ${user.fName} ${user.lName} to ${firstName} ${lastName}`);
      await User.update(
        { fName: firstName, lName: lastName, updatedAt: now },
        { where: { id: user.id } }
      );
      user.fName = firstName;
      user.lName = lastName;
    }

    // ── BEHAVIOR 1: No workplace → blocked ────────────────────────────────
    // User is in DB but has no workplace assigned yet
    if (!user.work_location) {
      console.log(`User ${email} has no work_location → blocking`);
      return res.status(200).send({
        blocked: true,
        reason:  'no_workplace',
        message: "Your account exists but hasn't been assigned to a workplace yet. Ask your supervisor.",
        email:  user.email,
        fName:  user.fName,
        lName:  user.lName,
      });
    }

    // ── BEHAVIOR 2: Multiple workplaces → show picker ─────────────────────
    let workplaces = [];
    try {
      if (db.userWorkplace) {
        const uwRecords = await db.userWorkplace.findAll({
          where: { userId: user.id },
        });
        if (uwRecords.length > 1) {
          const locationIds = uwRecords.map(uw => uw.locationId);
          const areas = await BusinessArea.findAll({
            where: { location_id: locationIds },
          });
          workplaces = areas.map(a => ({
            location_id: a.location_id,
            name:        a.name,
            address:     a.address || '',
          }));
        }
      }
    } catch (err) {
      console.warn("UserWorkplace lookup failed:", err.message);
    }

    // ── BEHAVIOR 2: No workplace → blocked / guest ─────────────────────────
    if (!user.work_location && workplaces.length === 0) {
      console.log("User has no workplace:", email, "→ blocking login");
      return res.status(200).send({
        blocked: true,
        message: "Your account is not linked to any workplace yet. Ask your supervisor to add you.",
        email:  user.email,
        fName:  user.fName,
        lName:  user.lName,
      });
    }

    if (workplaces.length > 1) {
      console.log(`User ${email} has ${workplaces.length} workplaces → sending picker`);
      const token     = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
      const expiresAt = now + 86400 * 1000;
      await Session.create({ token, userId: user.id, createdAt: now, isActive: 1, expiresAt });

      return res.status(200).send({
        needsWorkplaceSelect: true,
        workplaces,
        userId:        user.id,
        user_id:       user.id,
        email:         user.email,
        fName:         user.fName,
        lName:         user.lName,
        first_name:    user.fName,
        last_name:     user.lName,
        role:          user.role,
        work_location: user.work_location,
        token,
      });
    }

    // ── BEHAVIOR 3: Normal single-workplace login ─────────────────────────
    // Reuse existing valid session
    const existingSession = await Session.findOne({
      where: { userId: user.id, isActive: 1 },
    });

    if (existingSession) {
      if (existingSession.expiresAt && existingSession.expiresAt < now) {
        console.log("⏰ Session expired, creating new one");
        await Session.update(
          { isActive: 0 }, 
          { where: { id: existingSession.id } }
        );
      } else {
        console.log("♻️ Returning existing valid session");
        return res.send(buildUserPayload(user, existingSession.token));
      }
    }

    // Create new session for registered user
    console.log("🆕 Creating new session for user:", user.id);
    const token = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
    const expiresAt = now + 86400 * 1000;
    await Session.create({ token, userId: user.id, createdAt: now, isActive: 1, expiresAt });

    await Session.create({
      token,
      userId: user.id,
      createdAt: now,
      isActive: 1,
      expiresAt: expiresAt,
    });

    console.log("✅ New session created for", user.email, "role:", user.role);
    return res.send(buildUserPayload(user, token));

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send({
      message: err.message || "Error during login",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

function buildUserPayload(user, token) {
  const payload = {
    userId: user.id,
    user_id: user.id,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    first_name: user.fName,
    last_name: user.lName,
    role: user.role,
    isGuest: false,
    work_location: user.work_location,
    token,
  };
  
  console.log("📦 Built user payload:", payload);
  return payload;
}

exports.logout = async (req, res) => {
  if (!req.body?.token) return res.send({ message: "Already logged out." });
  try {
    const session = await Session.findOne({ where: { token: req.body.token } });
    if (!session) {
      return res.send({ message: "Already logged out." });
    }
    await Session.update(
      { isActive: 0 },
      { where: { id: session.id } }
    );
    console.log("✅ Logged out successfully");
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).send({ message: "Error logging out." });
  }
};

export default exports;