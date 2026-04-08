import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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

    let googleSub = googleUser.sub;
    let email     = googleUser.email;
    let firstName = googleUser.given_name;
    let lastName  = googleUser.family_name;

    if ((!email || !firstName || !lastName) && req.body.accessToken !== undefined) {
      const oauth2Client = new OAuth2Client(google_id);
      oauth2Client.setCredentials({ access_token: req.body.accessToken });
      const oauth2    = google.oauth2({ auth: oauth2Client, version: "v2" });
      const { data }  = await oauth2.userinfo.get();
      googleSub  = googleSub  || data.id;
      email      = email      || data.email;
      firstName  = firstName  || data.given_name;
      lastName   = lastName   || data.family_name;
    }

    const now = Date.now();

    // ── Find or create user ────────────────────────────────────────────────
    let user = await User.findOne({ where: { email } });

    if (user) {
      // ✅ Model JS fields are fName/lName — Sequelize maps them to first_name/last_name
      const nameChanged = user.fName !== firstName || user.lName !== lastName;
      if (nameChanged) {
        await User.update(
          { fName: firstName, lName: lastName, updatedAt: now },
          { where: { id: user.id } }
        );
        user.fName = firstName;
        user.lName = lastName;
      }
    } else {
      // Brand new Google user — create with no workplace yet
      const userId = googleSub || crypto.randomUUID();
      user = await User.create({
        id:        userId,
        fName:     firstName,   // Sequelize writes to first_name column
        lName:     lastName,    // Sequelize writes to last_name column
        email,
        role:      "employee",
        createdAt: now,
      });
      console.log("New user created:", user.id, "— no workplace yet");
    }

    // ── BEHAVIOR 1: Check for multiple workplaces first ──────────────────────
    let workplaces = [];
    try {
      if (db.userWorkplace) {
        const uwRecords = await db.userWorkplace.findAll({
          where: { userId: user.id },
        });

        if (uwRecords.length > 0) {
          // Fetch business area details for each workplace
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
      console.warn("UserWorkplace lookup failed (using work_location fallback):", err.message);
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
      console.log("User has multiple workplaces:", email, "→ sending picker");
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

    // ── BEHAVIOR 3: Single workplace — normal login ────────────────────────
    const existingSession = await Session.findOne({
      where: { userId: user.id, isActive: 1 },
    });

    if (existingSession) {
      if (existingSession.expiresAt && existingSession.expiresAt < now) {
        await Session.update({ isActive: 0 }, { where: { id: existingSession.id } });
      } else {
        console.log("Returning existing valid session for", email);
        return res.send(buildUserPayload(user, existingSession.token));
      }
    }

    const token     = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
    const expiresAt = now + 86400 * 1000;
    await Session.create({ token, userId: user.id, createdAt: now, isActive: 1, expiresAt });

    console.log("Login success:", email, "role:", user.role, "workplace:", user.work_location);
    return res.send(buildUserPayload(user, token));

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send({
      message: err.message || "Error during login",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// ── Build the user payload stored in localStorage ─────────────────────────
function buildUserPayload(user, token) {
  return {
    userId:        user.id,
    user_id:       user.id,
    email:         user.email,
    fName:         user.fName,       // JS field → reads from first_name column
    lName:         user.lName,       // JS field → reads from last_name column
    first_name:    user.fName,
    last_name:     user.lName,
    role:          user.role,
    work_location: user.work_location,
    token,
  };
}

exports.logout = async (req, res) => {
  if (!req.body?.token) return res.send({ message: "Already logged out." });
  try {
    const session = await Session.findOne({ where: { token: req.body.token } });
    if (!session) return res.send({ message: "Already logged out." });
    await Session.update({ isActive: 0 }, { where: { id: session.id } });
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    console.error("❌ Logout error:", err);
    return res.status(500).send({ message: "Error logging out." });
  }
};

export default exports;