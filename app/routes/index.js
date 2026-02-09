import express from 'express';
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.use("/coverage", coverageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/skills", skillRoutes);//here we add the skill routes
export default router;