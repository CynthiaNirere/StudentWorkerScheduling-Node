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

    if (user) {
      console.log("Found existing user:", user.id, "role:", user.role);

      // Update name if changed — but NEVER touch role or work_location
      const nameChanged = user.fName !== firstName || user.lName !== lastName;
      
      if (nameChanged) {
        await User.update(
          { 
            fName: firstName, 
            lName: lastName, 
            updatedAt: now 
          },
          { where: { id: user.id } }  // Use user.id
        );
        user.fName = firstName;
        user.lName = lastName;
      }
    } else {
      // Brand new user — default role is employee
      const userId = googleSub || crypto.randomUUID();
      const newUser = {
        id: userId,  // Use 'id' not 'user_id'
        fName: firstName,
        lName: lastName,
        email,
        role: "employee",
        createdAt: now,
      };
      console.log("Creating new user:", newUser);
      user = await User.create(newUser);
      console.log("User registered:", user.id);
    }

    const existingSession = await Session.findOne({
      where: { userId: user.id, isActive: 1 },  // Use user.id and camelCase
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

    // Create new session
    const token = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
    const expiresAt = now + 86400 * 1000;

    await Session.create({
      token,
      userId: user.id,  // Use camelCase - Sequelize will map to user_id
      createdAt: now,
      isActive: 1,
      expiresAt: expiresAt,
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
    userId: user.id,  // Use user.id
    user_id: user.id,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    first_name: user.fName,
    last_name: user.lName,
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
      { isActive: 0 },  // Use camelCase
      { where: { id: session.id } }
    );
    console.log("Logged out successfully");
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).send({ message: "Error logging out." });
  }
};

export default exports;