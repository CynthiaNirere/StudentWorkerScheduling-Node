import express from 'express';
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import availabilityRoutes from "./availability.routes.js";
import clockRoutes from "./clock.routes.js";
import coverageRoutes from "./coverage.routes.js";
import notificationRoutes from "./notifications.routes.js";
import skillRoutes from "./skills.routes.js";
import tasklistItem from "./taskListItem.routes.js";
import taskList from "./taskList.routes.js";
import shiftSwapRequestRoutes from "./shiftSwapRequest.routes.js";
import timeOffRequestRoutes from "./timeOffRequest.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.use("/coverage", coverageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/skills", skillRoutes);//here we add the skill routes
router.use("/taskListItem", tasklistItem);
router.use("/taskList", taskList);
router.use("/shiftSwapRequests", shiftSwapRequestRoutes);
router.use("/timeOffRequests", timeOffRequestRoutes);

export default router;