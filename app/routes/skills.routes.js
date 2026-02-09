import express from "express";
import * as skills from "../controllers/skill.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Skill CRUD
router.post("/", authenticate, skills.create);
router.get("/", authenticate, skills.findAll);
router.get("/:id", authenticate, skills.findOne);
router.put("/:id", authenticate, skills.update);
router.delete("/:id", authenticate, skills.remove);

// User skill assignments
router.post("/user/:userId", authenticate, skills.addSkillToUser);
router.get("/user/:userId", authenticate, skills.findByUser);
router.delete("/user/:userId/:skillId", authenticate, skills.removeSkillFromUser);

export default router;