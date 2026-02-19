import express from "express";
import * as users from "../controllers/user.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Specific routes FIRST (before /:id)
router.get("/email/:email", authenticate, users.findByEmail);

// Generic CRUD routes
router.post("/", authenticate, users.create);
router.get("/", authenticate, users.findAll);
router.get("/:id", authenticate, users.findOne);
router.put("/:id", authenticate, users.update);
router.delete("/:id", authenticate, users.remove);

export default router;