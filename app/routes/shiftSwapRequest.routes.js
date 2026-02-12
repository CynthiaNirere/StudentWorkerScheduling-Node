import express from "express";
import * as shiftSwapRequests from "../controllers/shiftSwapRequest.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", authenticate, shiftSwapRequests.create);
router.get("/", authenticate, shiftSwapRequests.findAll);
router.get("/pending", authenticate, shiftSwapRequests.findPending);
router.get("/:id", authenticate, shiftSwapRequests.findOne);
router.put("/:id", authenticate, shiftSwapRequests.update);
router.delete("/:id", authenticate, shiftSwapRequests.remove);

// Swap workflow operations
router.put("/:id/accept", authenticate, shiftSwapRequests.accept);
router.put("/:id/approve", authenticate, shiftSwapRequests.approve);
router.put("/:id/reject", authenticate, shiftSwapRequests.reject);
router.put("/:id/cancel", authenticate, shiftSwapRequests.cancel);

export default router;