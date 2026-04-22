import express from "express";
import * as users from "../controllers/user.controller.js";
import authenticate from "../authorization/authorization.js";
import attachLocation from "../authorization/attachLocation.js";

const router = express.Router();

// ── Special routes (must come before /:id) ───────────────────────────────
router.get("/search",                   authenticate, users.searchByName);
router.get("/email/:email",             authenticate, users.findByEmail);
router.post("/:userId/assign",          authenticate, users.assignToWorkplace);
router.delete("/:userId/workplace",     authenticate, users.removeFromWorkplace);

// ── Kiosk PIN routes ─────────────────────────────────────────────────────
router.get("/:id/kiosk-pin",            authenticate, users.getKioskPin);
router.put("/:id/kiosk-pin",            authenticate, users.setKioskPin);
router.put("/:id/kiosk-pin/verify",     authenticate, users.verifyKioskPin);

// ── Standard CRUD ────────────────────────────────────────────────────────
router.post("/",                        authenticate, attachLocation, users.create);
router.get("/",                         authenticate, attachLocation, users.findAll);
router.get("/:id",                      authenticate, users.findOne);
router.put("/:id",                      authenticate, users.update);
router.put("/:id/email-notifications",  authenticate, users.updateEmailNotificationPreference);
router.patch("/:id/certifications",     authenticate, users.updateCertifications);
router.delete("/:id",                   authenticate, users.remove);

export default router;