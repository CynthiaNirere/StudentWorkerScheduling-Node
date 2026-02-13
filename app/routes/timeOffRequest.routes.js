import express from "express";
import * as timeOffRequests from "../controllers/Timeoffrequest.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", authenticate, timeOffRequests.create);
router.get("/", authenticate, timeOffRequests.findAll);
router.get("/pending", authenticate, timeOffRequests.findPending);
router.get("/:id", authenticate, timeOffRequests.findOne);
router.put("/:id", authenticate, timeOffRequests.update);
router.delete("/:id", authenticate, timeOffRequests.remove);

// Approval operations
router.put("/:id/approve", authenticate, timeOffRequests.approve);
router.put("/:id/deny", authenticate, timeOffRequests.deny);

export default router;