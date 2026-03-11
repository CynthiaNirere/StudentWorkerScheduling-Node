import express from "express";
import * as shiftTask from "../controllers/shiftTask.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// ✅ Shift task management
router.post("/", authenticate, shiftTask.assignTaskToShift);
router.post("/bulk", authenticate, shiftTask.bulkAssignTasks);
router.get("/shift/:shiftId", authenticate, shiftTask.getShiftTasks);
router.get("/task/:tasklistId", authenticate, shiftTask.getTaskShifts);
router.delete("/shift/:shiftId/task/:tasklistId", authenticate, shiftTask.removeTaskFromShift);

export default router;