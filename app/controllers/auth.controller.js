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

  try {
    const googleToken = req.body.credential;

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

    // Fallback for testing — fetch via access token if fields missing
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
    let existingUser = await User.findOne({ where: { email } });

    let user;

    if (existingUser) {
      user = existingUser.dataValues;
      console.log("Found existing user:", user.id, "role:", user.role);

      // Update name if changed — but NEVER touch role or work_location
      const nameChanged = user.fName !== firstName || user.lName !== lastName;
      // Also update user_id to Google sub if it's still a placeholder
      const idIsPlaceholder = user.id && user.id.startsWith("employer-");

      if (nameChanged || idIsPlaceholder) {
        const updates = { updatedAt: now };
        if (nameChanged) {
          updates.fName = firstName;
          updates.lName = lastName;
        }
        if (idIsPlaceholder) {
          // Migrate placeholder ID to real Google sub
          // Note: MySQL VARCHAR PK update — cascade must be set or do carefully
          try {
            await User.update(
              { ...updates, id: googleSub },
              { where: { id: user.id } }
            );
            user.id = googleSub;
          } catch (pkErr) {
            // PK update can fail if FK constraints are strict; just update name then
            console.log("PK update skipped:", pkErr.message);
            if (nameChanged) {
              await User.update(updates, { where: { id: user.id } });
            }
          }
        } else if (nameChanged) {
          await User.update(updates, { where: { id: user.id } });
        }
        user.fName = firstName;
        user.lName = lastName;
      }
    } else {
      // Brand new user — default role is employee
      const userId = googleSub || crypto.randomUUID();
      const newUser = {
        id: userId,
        fName: firstName,
        lName: lastName,
        email,
        role: "employee",
        createdAt: now,
      };
      console.log("Creating new user:", newUser);
      const created = await User.create(newUser);
      user = created.dataValues;
      console.log("User registered:", user.id);
    }

    // ── Session management ─────────────────────────────────────────────
    const existingSession = await Session.findOne({
      where: { userId: user.id, isActive: 1 },
    });

    if (existingSession) {
      const sessionData = existingSession.dataValues;
      if (sessionData.expiresAt && sessionData.expiresAt < now) {
        console.log("Session expired, creating new one");
        await Session.update({ isActive: 0 }, { where: { id: sessionData.id } });
      } else {
        console.log("Returning existing valid session");
        return res.send(buildUserPayload(user, sessionData.token));
      }
    }

    // Create new session
    const token = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
    const expiresAt = now + 86400 * 1000;

    await Session.create({
      token,
      userId: user.id,
      createdAt: now,
      isActive: 1,
      expiresAt,
    });

    console.log("New session created for", user.email, "role:", user.role);
    return res.send(buildUserPayload(user, token));
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send({ message: err.message || "Error during login" });
  }
};

// ── Helper: shape the response the frontend stores ─────────────────────────
function buildUserPayload(user, token) {
  return {
    userId: user.id,
    user_id: user.id,   // both keys so frontend works regardless of which it reads
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    role: user.role,
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
    await Session.update({ isActive: 0 }, { where: { id: session.id } });
    console.log("Logged out successfully");
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).send({ message: "Error logging out." });
  }
};

export default exports;