import express from 'express';
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import businessAreaRoutes from "./businessArea.routes.js";
import jobRoleRoutes from "./jobRole.routes.js";
import sessionRoutes from "./session.routes.js";
import coverageRoutes from "./coverage.routes.js";
import notificationRoutes from "./notifications.routes.js";
import skillRoutes from "./skills.routes.js";
import availabilityRoutes from "./availability.routes.js";
import clockRoutes from "./clock.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import shiftRoutes from "./shift.routes.js";
import shiftSwapRequestRoutes from "./shiftSwapRequest.routes.js";
import taskListRoutes from "./taskList.routes.js";
import taskListItemRoutes from "./taskListItem.routes.js";
import timeOffRequestRoutes from "./timeOffRequest.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/business-areas", businessAreaRoutes);
router.use("/job-roles", jobRoleRoutes);
router.use("/sessions", sessionRoutes);
router.use("/coverage", coverageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/skills", skillRoutes);
router.use("/availability", availabilityRoutes);
router.use("/clock", clockRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/shifts", shiftRoutes);
router.use("/shift-swaps", shiftSwapRequestRoutes);
router.use("/task-lists", taskListRoutes);
router.use("/task-list-items", taskListItemRoutes);
router.use("/time-off", timeOffRequestRoutes);

export default router;