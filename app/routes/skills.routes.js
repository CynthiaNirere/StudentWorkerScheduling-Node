import express from "express";
import * as skills from "../controllers/skills.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Skill CRUD
router.post("/", skills.create);  // Remove authenticate for testing
router.get("/", authenticate, skills.findAll);
router.get("/:id", authenticate, skills.findOne);
router.put("/:id", authenticate, skills.update);
router.delete("/:id", authenticate, skills.remove);



export default router;