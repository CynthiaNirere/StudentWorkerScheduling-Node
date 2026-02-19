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
      console.log("Found existing user:", user.user_id, "role:", user.role);

      // Update name if changed — but NEVER touch role or work_location
      const currentFirstName = user.first_name || user.fName;
      const currentLastName = user.last_name || user.lName;
      const nameChanged = currentFirstName !== firstName || currentLastName !== lastName;
      
      // Also update user_id to Google sub if it's still a placeholder
      const idIsPlaceholder = user.user_id && user.user_id.startsWith("employer-");

      if (nameChanged || idIsPlaceholder) {
        const updates = { updated_at: now };
        
        if (nameChanged) {
          updates.first_name = firstName;
          updates.last_name = lastName;
        }
        
        if (idIsPlaceholder) {
          // Migrate placeholder ID to real Google sub
          try {
            await User.update(
              { ...updates, user_id: googleSub },
              { where: { user_id: user.user_id } }
            );
            user.user_id = googleSub;
          } catch (pkErr) {
            // PK update can fail if FK constraints are strict
            console.log("PK update skipped:", pkErr.message);
            if (nameChanged) {
              await User.update(updates, { where: { user_id: user.user_id } });
            }
          }
        } else if (nameChanged) {
          await User.update(updates, { where: { user_id: user.user_id } });
        }
        
        user.first_name = firstName;
        user.last_name = lastName;
      }
    } else {
      // Brand new user — default role is employee
      const userId = googleSub || crypto.randomUUID();
      const newUser = {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        role: "employee",
        created_at: now,
      };
      console.log("Creating new user:", newUser);
      const created = await User.create(newUser);
      user = created.dataValues;
      console.log("User registered:", user.user_id);
    }

    // ── Session management ─────────────────────────────────────────────
    const existingSession = await Session.findOne({
      where: { user_id: user.user_id, is_active: 1 },
    });

    if (existingSession) {
      const sessionData = existingSession.dataValues;
      if (sessionData.expires_at && sessionData.expires_at < now) {
        console.log("Session expired, creating new one");
        await Session.update(
          { is_active: 0 }, 
          { where: { session_id: sessionData.session_id } }
        );
      } else {
        console.log("Returning existing valid session");
        return res.send(buildUserPayload(user, sessionData.token));
      }
    }

    // Create new session
    const token = jwt.sign({ id: user.user_id }, authconfig.secret, { expiresIn: 86400 });
    const expiresAt = now + 86400 * 1000;

    await Session.create({
      token,
      user_id: user.user_id,
      created_at: now,
      is_active: 1,
      expires_at: expiresAt,
    });

    console.log("New session created for", user.email, "role:", user.role);
    return res.send(buildUserPayload(user, token));
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send({ 
      message: err.message || "Error during login",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ── Helper: shape the response the frontend stores ─────────────────────────
function buildUserPayload(user, token) {
  return {
    userId: user.user_id,
    user_id: user.user_id,
    email: user.email,
    fName: user.first_name || user.fName,
    lName: user.last_name || user.lName,
    first_name: user.first_name || user.fName,
    last_name: user.last_name || user.lName,
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
    await Session.update(
      { is_active: 0 }, 
      { where: { session_id: session.session_id } }
    );
    console.log("Logged out successfully");
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).send({ message: "Error logging out." });
  }
};

export default exports;