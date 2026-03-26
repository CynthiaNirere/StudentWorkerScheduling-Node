import express from "express";
import * as timeOffRequests from "../controllers/timeOffRequest.controller.js";
import authenticate from "../authorization/authorization.js";
import attachLocation from "../authorization/attachLocation.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", authenticate, timeOffRequests.create);
router.get("/", authenticate, attachLocation, timeOffRequests.findAll);
router.get("/pending", authenticate, attachLocation, timeOffRequests.findPending);
router.get("/:id", authenticate, timeOffRequests.findOne);
router.put("/:id", authenticate, timeOffRequests.update);
router.delete("/:id", authenticate, timeOffRequests.remove);

// Approval operations
router.put("/:id/approve", authenticate, timeOffRequests.approve);
router.put("/:id/deny", authenticate, timeOffRequests.deny);

export default router;