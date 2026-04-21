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
    const ticket     = await client.verifyIdToken({
      idToken:            googleToken,
      audience:           google_id,
      clockSkewInSeconds: 60,
    });
    const googleUser = ticket.getPayload();

    let email     = googleUser.email;
    let firstName = googleUser.given_name;
    let lastName  = googleUser.family_name;

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

    console.log(`🔍 Looking for user with email: ${email}`);
    let user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`👤 GUEST USER detected: ${email}`);
      const guestToken = jwt.sign({ email, isGuest: true }, authconfig.secret, { expiresIn: 86400 });

      // No DB session needed for guests — JWT is self-contained
      console.log("✅ Guest token issued for:", email);

      return res.send({
        userId:       null,
        user_id:      null,
        email,
        fName:        firstName,
        lName:        lastName,
        first_name:   firstName,
        last_name:    lastName,
        role:         'guest',
        isGuest:      true,
        work_location: null,
        token:        guestToken,
        message:      "Guest login - not registered in system",
      });
    }

    console.log(`✅ Found registered user:`, { id: user.id, email: user.email, role: user.role, work_location: user.work_location });

    const nameChanged = user.fName !== firstName || user.lName !== lastName;
    if (nameChanged) {
      await User.update({ fName: firstName, lName: lastName, updatedAt: now }, { where: { id: user.id } });
      user.fName = firstName;
      user.lName = lastName;
    }

    // ── BEHAVIOR 1: No workplace → blocked (admins bypass) ────────────
    if (!user.work_location && user.role !== 'admin') {
      console.log(`User ${email} has no work_location → blocking`);
      return res.status(200).send({
        blocked:  true,
        reason:   'no_workplace',
        message:  "Your account exists but hasn't been assigned to a workplace yet. Ask your supervisor.",
        email:    user.email,
        fName:    user.fName,
        lName:    user.lName,
      });
    }

    // ── BEHAVIOR 2: Multiple workplaces → show picker ─────────────────
    let workplaces = [];
    try {
      if (db.userWorkplace) {
        const uwRecords = await db.userWorkplace.findAll({ where: { userId: user.id } });
        if (uwRecords.length > 1) {
          const locationIds = uwRecords.map(uw => uw.locationId);
          const areas       = await BusinessArea.findAll({ where: { location_id: locationIds } });
          workplaces = areas.map(a => ({ location_id: a.location_id, name: a.name, address: a.address || '' }));
        }
      }
    } catch (err) {
      console.warn("UserWorkplace lookup failed:", err.message);
    }

    if (workplaces.length > 1) {
      console.log(`User ${email} has ${workplaces.length} workplaces → sending picker`);
      const token     = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
      const expiresAt = now + 86400 * 1000;
      await Session.create({ token, userId: user.id, createdAt: now, isActive: 1, expiresAt });
      return res.status(200).send({
        needsWorkplaceSelect: true,
        workplaces,
        userId:       user.id,
        user_id:      user.id,
        email:        user.email,
        fName:        user.fName,
        lName:        user.lName,
        first_name:   user.fName,
        last_name:    user.lName,
        role:         user.role,
        work_location: user.work_location,
        token,
      });
    }

    // ── BEHAVIOR 3: Normal login ──────────────────────────────────────
    const existingSession = await Session.findOne({ where: { userId: user.id, isActive: 1 } });

    if (existingSession) {
      if (existingSession.expiresAt && existingSession.expiresAt < now) {
        console.log("⏰ Session expired, creating new one");
        await Session.update({ isActive: 0 }, { where: { id: existingSession.id } });
      } else {
        console.log("♻️ Returning existing valid session");
        return res.send(buildUserPayload(user, existingSession.token));
      }
    }

    console.log("🆕 Creating new session for user:", user.id);
    const token     = jwt.sign({ id: user.id }, authconfig.secret, { expiresIn: 86400 });
    const expiresAt = now + 86400 * 1000;
    await Session.create({ token, userId: user.id, createdAt: now, isActive: 1, expiresAt });

    console.log("✅ New session created for", user.email, "role:", user.role);
    return res.send(buildUserPayload(user, token));

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send({ message: err.message || "Error during login", error: process.env.NODE_ENV === "development" ? err.stack : undefined });
  }
};

// ── IMPERSONATE ───────────────────────────────────────────────────────────
exports.impersonate = async (req, res) => {
  try {
    const adminId   = req.user?.userId || req.user?.id;
    const adminUser = await User.findOne({ where: { id: adminId } });

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).send({ message: "Only admins can impersonate workplaces." });
    }

    const { locationId } = req.body;
    if (!locationId) return res.status(400).send({ message: "locationId is required." });

    const area = await BusinessArea.findOne({ where: { location_id: locationId } });
    if (!area) return res.status(404).send({ message: "Workplace not found." });

    const impersonationToken = jwt.sign(
      {
        id:                       adminUser.id,
        role:                     'employer',
        actualRole:               'admin',
        isImpersonating:          true,
        impersonatedLocation:     locationId,
        impersonatedLocationName: area.name,
      },
      authconfig.secret,
      { expiresIn: 3600 }
    );

    console.log(`👁️ Admin ${adminUser.email} impersonating: ${area.name} (${locationId})`);

    return res.send({
      token:                    impersonationToken,
      isImpersonating:          true,
      impersonatedLocation:     locationId,
      impersonatedLocationName: area.name,
      userId:        adminUser.id,
      user_id:       adminUser.id,
      email:         adminUser.email,
      fName:         adminUser.fName,
      lName:         adminUser.lName,
      first_name:    adminUser.fName,
      last_name:     adminUser.lName,
      role:          'employer',
      actualRole:    'admin',
      work_location: locationId,
    });

  } catch (err) {
    console.error("Impersonation error:", err);
    return res.status(500).send({ message: "Error starting impersonation." });
  }
};

// ── EXIT IMPERSONATION ────────────────────────────────────────────────────
exports.exitImpersonation = async (req, res) => {
  try {
    const { adminToken } = req.body;
    if (!adminToken) return res.status(400).send({ message: "adminToken is required." });

    let decoded;
    try {
      decoded = jwt.verify(adminToken, authconfig.secret);
    } catch {
      return res.status(401).send({ message: "Invalid or expired admin token." });
    }

    const adminUser = await User.findOne({ where: { id: decoded.id } });
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).send({ message: "Token does not belong to an admin." });
    }

    console.log(`✅ Admin ${adminUser.email} exited impersonation`);

    return res.send({
      message:         "Impersonation ended.",
      isImpersonating: false,
      userId:          adminUser.id,
      user_id:         adminUser.id,
      email:           adminUser.email,
      fName:           adminUser.fName,
      lName:           adminUser.lName,
      first_name:      adminUser.fName,
      last_name:       adminUser.lName,
      role:            'admin',
      work_location:   adminUser.work_location,
      token:           adminToken,
    });

  } catch (err) {
    console.error("Exit impersonation error:", err);
    return res.status(500).send({ message: "Error exiting impersonation." });
  }
};

function buildUserPayload(user, token) {
  const payload = {
    userId:        user.id,
    user_id:       user.id,
    email:         user.email,
    fName:         user.fName,
    lName:         user.lName,
    first_name:    user.fName,
    last_name:     user.lName,
    role:          user.role,
    isGuest:       false,
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
    if (!session) return res.send({ message: "Already logged out." });
    await Session.update({ isActive: 0 }, { where: { id: session.id } });
    console.log("✅ Logged out successfully");
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).send({ message: "Error logging out." });
  }
};

export default exports;