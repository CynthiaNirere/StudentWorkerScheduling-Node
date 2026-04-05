import express from "express";
import * as controller from "../controllers/taskCompletionHistory.controller.js";

const router = express.Router();

// Get all completion history
router.get("/all", controller.findAll);

// Get yesterday's completion stats
router.get("/yesterday", controller.getYesterdayStats);

// Get completion history by date range
router.get("/range/:startDate/:endDate", controller.findByDateRange);

// Create completion history entry
router.post("/", controller.create);

export default router;