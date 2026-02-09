import express from "express";
import * as taskListItems from "../controllers/taskListItem.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", authenticate, taskListItems.create);
router.get("/", authenticate, taskListItems.findAll);
router.get("/tasklist/:tasklistId", authenticate, taskListItems.findByTaskList);
router.get("/:id", authenticate, taskListItems.findOne);
router.put("/:id", authenticate, taskListItems.update);
router.delete("/:id", authenticate, taskListItems.remove);

// Special operations
router.put("/:id/complete", authenticate, taskListItems.complete);
router.put("/reorder", authenticate, taskListItems.reorder);

export default router;