import express from 'express';
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import availabilityRoutes from "./availability.routes.js";
import clockRoutes from "./clock.routes.js";
import coverageRoutes from "./coverage.routes.js";
import notificationRoutes from "./notifications.routes.js";
import adminRoutes from "./admin.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/availabilities", availabilityRoutes);
router.use("/clock", clockRoutes);

router.use("/coverage", coverageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
export default router;