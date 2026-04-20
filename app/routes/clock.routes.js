import express from "express";
import * as clock from "../controllers/clock.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Clock actions
router.post("/clock-in",            authenticate, clock.clockIn);
router.post("/manual",              authenticate, clock.createManual);
router.put("/clock-out/:id",        authenticate, clock.clockOut);

// ── NEW: Submit timecard for a pay period ─────────────────────────────────
// Employee calls this at end of week to send their hours for manager review.
router.post("/submit-timecard",     authenticate, clock.submitTimecard);

// Record lookup
router.get("/",                     authenticate, clock.findAll);
router.get("/:id",                  authenticate, clock.findOne);

// Employer actions
router.put("/:id/approve",          authenticate, clock.approve);
router.put("/:id/reject",           authenticate, clock.reject);
router.put("/:id/modify",           authenticate, clock.modify);

// Delete
router.delete("/:id",               authenticate, clock.remove);

export default router;