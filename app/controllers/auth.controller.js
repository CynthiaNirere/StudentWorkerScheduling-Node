import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const User = db.user;
const Session = db.session;
const Op = db.Sequelize.Op;

let googleUser = {};

const google_id = process.env.CLIENT_ID;
const google_secret = process.env.CLIENT_SECRET;

const exports = {};

exports.login = async (req, res) => {
  console.log("=== LOGIN REQUEST ===");
  
  try {
    var googleToken = req.body.credential;

    const client = new OAuth2Client(google_id);
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    googleUser = ticket.getPayload();
    console.log("Google payload is " + JSON.stringify(googleUser));

    let googleSub = googleUser.sub;
    let email = googleUser.email;
    let firstName = googleUser.given_name;
    let lastName = googleUser.family_name;

    // if we don't have their email or name, we need to make another request
    // this is solely for testing purposes
    if (
      (email === undefined ||
        firstName === undefined ||
        lastName === undefined) &&
      req.body.accessToken !== undefined
    ) {
      let oauth2Client = new OAuth2Client(google_id);
      oauth2Client.setCredentials({ access_token: req.body.accessToken });
      let oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
      });
      let { data } = await oauth2.userinfo.get();
      console.log(data);
      googleSub = googleSub || data.id;
      email = data.email;
      firstName = data.given_name;
      lastName = data.family_name;
    }

    const now = Date.now();

    // Find or create user
    let user = await User.findOne({
      where: { email: email },
    });

    if (user) {
      user = user.dataValues;
      console.log("Found existing user:", user);
      
      // Update user's name if it changed
      if (user.fName !== firstName || user.lName !== lastName) {
        try {
          await User.update(
            { fName: firstName, lName: lastName, updatedAt: now },
            { where: { id: user.id } }
          );
          user.fName = firstName;
          user.lName = lastName;
          console.log("Updated user's name");
        } catch (updateErr) {
          console.log("Error updating user name (non-critical):", updateErr.message);
        }
      }
    } else {
      // Create new user — use Google sub as user_id
      const userId = googleSub || crypto.randomUUID();
      const newUser = {
        id: userId,
        fName: firstName,
        lName: lastName,
        email: email,
        role: "employee",
        createdAt: now,
      };
      console.log("Creating new user:", newUser);
      
      const created = await User.create(newUser);
      user = created.dataValues;
      console.log("User was registered successfully!");
    }

    // Check for existing valid session
    const existingSession = await Session.findOne({
      where: {
        userId: user.id,
        isActive: 1,
      },
    });

    if (existingSession) {
      const sessionData = existingSession.dataValues;
      
      // Check if session is expired
      if (sessionData.expiresAt && sessionData.expiresAt < now) {
        console.log("Session expired, deactivating it");
        await Session.update({ isActive: 0 }, { where: { id: sessionData.id } });
      } else {
        // Valid session exists, return it
        console.log("Found existing valid session");
        return res.send({
          email: user.email,
          fName: user.fName,
          lName: user.lName,
          userId: user.id,
          role: user.role,
          token: sessionData.token
        });
      }
    }

    // Create new session
    let token = jwt.sign({ id: user.id }, authconfig.secret, {
      expiresIn: 86400,
    });
    
    const expiresAt = now + (86400 * 1000); // 24 hours in ms
    
    const newSession = {
      token: token,
      userId: user.id,
      createdAt: now,
      isActive: 1,
      expiresAt: expiresAt,
    };

    console.log("making a new session");

    await Session.create(newSession);
    
    console.log("New session created - returning user");
    return res.send({
      email: user.email,
      fName: user.fName,
      lName: user.lName,
      userId: user.id,
      role: user.role,
      token: token
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send({ 
      message: err.message || "Error during login" 
    });
  }
};

exports.logout = async (req, res) => {
  console.log("=== LOGOUT REQUEST ===");
  
  // Check if request body is null or empty
  if (!req.body || !req.body.token) {
    return res.send({
      message: "User has already been successfully logged out!",
    });
  }

  try {
    const session = await Session.findOne({ where: { token: req.body.token } });

    if (!session) {
      console.log("already logged out");
      return res.send({
        message: "User has already been successfully logged out!",
      });
    }

    // Deactivate the session
    await Session.update({ isActive: 0 }, { where: { id: session.id } });
    console.log("successfully logged out");
    return res.send({
      message: "User has been successfully logged out!",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).send({
      message: "Error logging out user.",
    });
  }
};

export default exports;