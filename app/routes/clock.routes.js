import express from "express";
import * as clock from "../controllers/clock.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// ─── EMPLOYEE CLOCK ACTIONS ───────────────────────────────────────────────
router.post("/clock-in", authenticate, clock.clockIn);
router.put("/clock-out/:id", authenticate, clock.clockOut);

// ─── READ ─────────────────────────────────────────────────────────────────
router.get("/", authenticate, clock.findAll);
router.get("/user/:userId", authenticate, clock.findByUser);
router.get("/:id", authenticate, clock.findOne);

// ─── GENERAL UPDATE / DELETE ──────────────────────────────────────────────
router.put("/:id", authenticate, clock.update);
router.delete("/:id", authenticate, clock.remove);

// ─── EMPLOYER TIME CARD ACTIONS ───────────────────────────────────────────
router.put("/:id/approve", authenticate, clock.approve);   
router.put("/:id/reject", authenticate, clock.reject);     
router.put("/:id/modify", authenticate, clock.modify);     

export default router;