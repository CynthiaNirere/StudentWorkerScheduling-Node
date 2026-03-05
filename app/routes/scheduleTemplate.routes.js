import express from "express";
import * as templates from "../controllers/scheduleTemplate.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", authenticate, templates.create);
router.get("/", authenticate, templates.findAll);
router.get("/:id", authenticate, templates.findOne);
router.put("/:id", authenticate, templates.update);
router.delete("/:id", authenticate, templates.remove);

// Special operation - apply template to a week
router.post("/:id/apply", authenticate, templates.applyToWeek);

export default router;