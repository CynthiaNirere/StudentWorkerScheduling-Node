import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

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
      email = data.email;
      firstName = data.given_name;
      lastName = data.family_name;
    }

    // Find or create user
    let user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (user) {
      user = user.dataValues;
      console.log("Found existing user:", user);
      
      // Update user's name if it changed
      if (user.fName !== firstName || user.lName !== lastName) {
        try {
          await User.update(
            { 
              first_name: firstName,
              last_name: lastName 
            }, 
            { where: { user_id: user.id } }
          );
          user.fName = firstName;
          user.lName = lastName;
          console.log("Updated user's name");
        } catch (updateErr) {
          console.log("Error updating user name (non-critical):", updateErr.message);
        }
      }
    } else {
      // Create new user
      const newUser = {
        fName: firstName,
        lName: lastName,
        email: email,
        role: email.endsWith("@eagles.oc.edu") ? "athlete" : "coach",
      };
      console.log("Creating new user:", newUser);
      
      const created = await User.create(newUser);
      user = created.dataValues;
      console.log("User was registered successfully!");
    }

    // Check for existing valid session
    const existingSession = await Session.findOne({
      where: {
        email: email,
      },
    });

    if (existingSession) {
      const sessionData = existingSession.dataValues;
      
      // Check if session is expired
      if (sessionData.expirationDate < Date.now()) {
        console.log("Session expired, deleting it");
        await Session.destroy({ where: { id: sessionData.id } });
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
    let token = jwt.sign({ id: email }, authconfig.secret, {
      expiresIn: 86400,
    });
    
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);
    
    const newSession = {
      token: token,
      email: email,
      userId: user.id,               
      expirationDate: tempExpirationDate,  
    };

    console.log("making a new session");
    console.log(newSession);

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
  console.log(req.body);
  
  // Check if request body is null or empty
  if (!req.body || !req.body.token) {
    return res.send({
      message: "User has already been successfully logged out!",
    });
  }

  let session = {};

  try {
    const data = await Session.findAll({ where: { token: req.body.token } });
    if (data[0] !== undefined) {
      session = data[0].dataValues;
    }
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving sessions.",
    });
  }

  // If session doesn't exist, user is already logged out
  if (session.id === undefined) {
    console.log("already logged out");
    return res.send({
      message: "User has already been successfully logged out!",
    });
  }

  // Delete the session
  try {
    const num = await Session.destroy({ where: { id: session.id } });
    if (num == 1) {
      console.log("successfully logged out");
      return res.send({
        message: "User has been successfully logged out!",
      });
    } else {
      console.log("failed to delete session");
      return res.send({
        message: `Error logging out user.`,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: "Error logging out user.",
    });
  }
};

export default exports;