import express from 'express';
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import adminRoutes from "./admin.routes.js";  // ✅ ADD THIS
import scheduleRoutes from "./schedule.routes.js";
import availabilityRoutes from "./availability.routes.js";
import clockRoutes from "./clock.routes.js";
import coverageRoutes from "./coverage.routes.js";
import notificationRoutes from "./notifications.routes.js";
import skillRoutes from "./skills.routes.js";
import tasklistItemRoutes from "./taskListItem.routes.js";
import taskListRoutes from "./taskList.routes.js";
import shiftSwapRequestRoutes from "./shiftSwapRequest.routes.js";
import timeOffRequestRoutes from "./timeOffRequest.routes.js";
import shiftRoutes from "./shift.routes.js";
import businessAreaRoutes from "./businessArea.routes.js";
import jobRoleRoutes from "./jobRole.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);  // ✅ ADD THIS

router.use("/business-areas", businessAreaRoutes);
router.use("/job-roles", jobRoleRoutes);

router.use("/shifts", shiftRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/availability", availabilityRoutes);

router.use("/clock", clockRoutes);

router.use("/time-off-requests", timeOffRequestRoutes);
router.use("/shift-swaps", shiftSwapRequestRoutes);

router.use("/tasklist", taskListRoutes);
router.use("/tasklist/items", tasklistItemRoutes);

router.use("/coverage", coverageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/skills", skillRoutes);

export default router;