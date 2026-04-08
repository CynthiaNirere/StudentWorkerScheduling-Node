import express from "express";
import * as users from "../controllers/user.controller.js";
import authenticate from "../authorization/authorization.js";
import attachLocation from "../authorization/attachLocation.js";

const router = express.Router();

// Search existing users by name (for assign-to-workplace flow)
router.get("/search", authenticate, users.searchByName);

// Assign an existing user to the employer's workplace (no new record created)
router.post("/:userId/assign", authenticate, users.assignToWorkplace);

// Specific routes FIRST (before /:id)
router.get("/email/:email", authenticate, users.findByEmail);

// Generic CRUD routes
router.post("/", authenticate, attachLocation, users.create);
router.get("/", authenticate, attachLocation, users.findAll);
router.get("/:id", authenticate, users.findOne);
router.put("/:id", authenticate, users.update);
router.delete("/:id", authenticate, users.remove);

export default router;