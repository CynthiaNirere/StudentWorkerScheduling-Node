import express from "express";
import * as controller from "../controllers/taskListItem.controller.js";

const router = express.Router();

// Get all task list items (with optional filter by tasklistId)
router.get("/", controller.findAll);

// Get task list items by tasklist ID
router.get("/tasklist/:tasklistId", controller.findByTaskList);

// Get single task list item
router.get("/:id", controller.findOne);

// Create new task list item
router.post("/", controller.create);

// Update task list item
router.put("/:id", controller.update);

// Delete task list item
router.delete("/:id", controller.remove);

// Mark task list item as complete
router.put("/:id/complete", controller.complete);

// Reorder items
router.put("/reorder", controller.reorder);

export default router;