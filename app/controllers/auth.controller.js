import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const User = db.user;
const Session = db.session;

const google_id = process.env.CLIENT_ID;
const google_secret = process.env.CLIENT_SECRET;

const exports = {};

exports.login = async (req, res) => {
  console.log("=== LOGIN REQUEST ===");
  console.log("Request body:", req.body);

  try {
    const googleToken = req.body.credential;

    if (!googleToken) {
      return res.status(400).send({ message: "No credential provided" });
    }

    const client = new OAuth2Client(google_id);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    const googleUser = ticket.getPayload();
    console.log("Google payload:", JSON.stringify(googleUser));

    let googleSub = googleUser.sub;
    let email = googleUser.email;
    let firstName = googleUser.given_name;
    let lastName = googleUser.family_name;

    if (
      (!email || !firstName || !lastName) &&
      req.body.accessToken !== undefined
    ) {
      const oauth2Client = new OAuth2Client(google_id);
      oauth2Client.setCredentials({ access_token: req.body.accessToken });
      const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
      const { data } = await oauth2.userinfo.get();
      googleSub = googleSub || data.id;
      email = email || data.email;
      firstName = firstName || data.given_name;
      lastName = lastName || data.family_name;
    }

    const now = Date.now();

    // ── Find existing user by email ────────────────────────────────────
    let user = await User.findOne({ where: { email } });

    // ✅ GUEST USER HANDLING - User not found in database
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

      console.log("Guest session created for:", email);
      
      return res.send({
        userId: null,
        user_id: null,
        email: email,
        fName: firstName,
        lName: lastName,
        first_name: firstName,
        last_name: lastName,
        role: 'guest', // ✅ GUEST ROLE
        isGuest: true,
        work_location: null,
        token: guestToken,
        message: "Guest login - not registered in system"
      });
    }

    // ✅ REGISTERED USER - Update name if changed
    console.log("Found existing user:", user.id, "role:", user.role);

    const nameChanged = user.fName !== firstName || user.lName !== lastName;
    
    if (nameChanged) {
      await User.update(
        { 
          fName: firstName, 
          lName: lastName, 
          updatedAt: now 
        },
        { where: { id: user.id } }
      );
      user.fName = firstName;
      user.lName = lastName;
    }

    // Check for existing session
    const existingSession = await Session.findOne({
      where: { userId: user.id, isActive: 1 },
    });

    if (existingSession) {
      if (existingSession.expiresAt && existingSession.expiresAt < now) {
        console.log("Session expired, creating new one");
        await Session.update(
          { isActive: 0 }, 
          { where: { id: existingSession.id } }
        );
      } else {
        console.log("Returning existing valid session");
        return res.send(buildUserPayload(user, existingSession.token));
      }
    }

    // Create new session for registered user
    const token = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
    const expiresAt = now + 86400 * 1000;

    await Session.create({
      token,
      userId: user.id,
      createdAt: now,
      isActive: 1,
      expiresAt: expiresAt,
    });

    console.log("New session created for", user.email, "role:", user.role);
    return res.send(buildUserPayload(user, token));
    
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).send({ 
      message: err.message || "Error during login",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ── Helper: shape the response the frontend stores ─────────────────────────
function buildUserPayload(user, token) {
  return {
    userId: user.id,
    user_id: user.id,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    first_name: user.fName,
    last_name: user.lName,
    role: user.role,
    isGuest: false, // ✅ Regular users are not guests
    work_location: user.work_location,
    token,
  };
}

exports.logout = async (req, res) => {
  console.log("=== LOGOUT REQUEST ===");

  if (!req.body?.token) {
    return res.send({ message: "Already logged out." });
  }

  try {
    const session = await Session.findOne({ where: { token: req.body.token } });
    if (!session) {
      return res.send({ message: "Already logged out." });
    }
    await Session.update(
      { isActive: 0 },
      { where: { id: session.id } }
    );
    console.log("Logged out successfully");
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    console.error("❌ Logout error:", err);
    return res.status(500).send({ message: "Error logging out." });
  }
};

export default exports;