import express from 'express';
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import shiftRoutes from "./shift.routes.js";
import timeOffRequestRoutes from "./Timeoffrequest.routes.js";
import shiftSwapRequestRoutes from "./Shiftswaprequest.routes.js";
import taskListRoutes from "./taskList.routes.js";
import taskListItemRoutes from "./taskListItem.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/shifts", shiftRoutes);
router.use("/time-off-requests", timeOffRequestRoutes);
router.use("/shift-swap-requests", shiftSwapRequestRoutes);
router.use("/task-lists", taskListRoutes);
router.use("/task-list-items", taskListItemRoutes);

export default router;