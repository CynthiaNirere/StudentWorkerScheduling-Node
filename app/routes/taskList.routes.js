import express from "express";
import * as taskLists from "../controllers/taskList.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", authenticate, taskLists.create);
router.get("/", authenticate, taskLists.findAll);
router.get("/:id", authenticate, taskLists.findOne);
router.put("/:id", authenticate, taskLists.update);
router.delete("/:id", authenticate, taskLists.remove);

// Special operations
router.put("/:id/complete", authenticate, taskLists.complete);
router.put("/:id/archive", authenticate, taskLists.archive);

// ✅ NEW: Template and daily task operations
router.get("/templates/all", authenticate, taskLists.findAllTemplates);
router.get("/daily/:date", authenticate, taskLists.findDailyAssignments);
router.get("/user/:userId/daily/:date", authenticate, taskLists.findUserDailyTasks);
router.post("/:id/assign-to-shift", authenticate, taskLists.assignToShift);
router.get("/history/all", authenticate, taskLists.getCompletionHistory);

export default router;