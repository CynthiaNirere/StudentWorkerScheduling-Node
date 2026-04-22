import express from 'express';
import authRoutes                  from "./auth.routes.js";
import userRoutes                  from "./user.routes.js";
import adminRoutes                 from "./admin.routes.js";
import scheduleRoutes              from "./schedule.routes.js";
import availabilityRoutes          from "./availability.routes.js";
import clockRoutes                 from "./clock.routes.js";
import coverageRoutes              from "./coverage.routes.js";
import notificationRoutes          from "./notifications.routes.js";
import skillRoutes                 from "./skills.routes.js";
import tasklistItemRoutes          from "./taskListItem.routes.js";
import taskListRoutes              from "./taskList.routes.js";
import shiftSwapRequestRoutes      from "./shiftSwapRequest.routes.js";
import timeOffRequestRoutes        from "./timeOffRequest.routes.js";
import shiftRoutes                 from "./shift.routes.js";
import businessAreaRoutes          from "./businessArea.routes.js";
import jobRoleRoutes               from "./jobRole.routes.js";
import scheduleTemplateRoutes      from "./scheduleTemplate.routes.js";
import userJobRoleRoutes           from "./userJobRole.routes.js";
import shiftTaskRoutes             from "./shiftTask.routes.js";
import messageRoutes               from "./message.routes.js";
import taskCompletionHistoryRoutes from "./taskCompletionHistory.routes.js";
import taskAssignmentRoutes        from "./taskAssignment.routes.js";   // ✅ NEW


const router = express.Router();

router.use("/auth",                authRoutes);
router.use("/users",               userRoutes);
router.use("/admin",               adminRoutes);
router.use("/business-areas",      businessAreaRoutes);
router.use("/job-roles",           jobRoleRoutes);
router.use("/shifts",              shiftRoutes);
router.use("/schedule",            scheduleRoutes);
router.use("/schedule-templates",  scheduleTemplateRoutes);
router.use("/availability",        availabilityRoutes);
router.use("/clock",               clockRoutes);
router.use("/clock-records",       clockRoutes);
router.use("/time-off-requests",   timeOffRequestRoutes);
router.use("/shift-swap-requests", shiftSwapRequestRoutes);
router.use("/task-lists",          taskListRoutes);
router.use("/task-list-items",     tasklistItemRoutes);
router.use("/tasklistitems",       tasklistItemRoutes);
router.use("/task-assignments",    taskAssignmentRoutes);               // ✅ NEW
router.use("/coverage",            coverageRoutes);
router.use("/notifications",       notificationRoutes);
router.use("/skills",              skillRoutes);
router.use("/user-job-roles",      userJobRoleRoutes);
router.use("/shift-tasks",         shiftTaskRoutes);
router.use("/messages",            messageRoutes);
router.use("/tasklists/history",   taskCompletionHistoryRoutes);

export default router;