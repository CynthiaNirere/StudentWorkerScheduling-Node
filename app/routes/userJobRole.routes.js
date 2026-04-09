import express from "express";
import * as userJobRole from "../controllers/userJobRole.controller.js";
import authenticate from "../authorization/authorization.js";
import attachLocation from "../authorization/attachLocation.js";

const router = express.Router();

// ✅ User role management
router.post("/user/:userId/roles", authenticate, userJobRole.addRoleToUser);
router.get("/user/:userId/roles", authenticate, userJobRole.getUserRoles);
router.delete("/user/:userId/roles/:roleId", authenticate, userJobRole.removeRoleFromUser);
router.put("/user/:userId/roles/:roleId/primary", authenticate, attachLocation, userJobRole.setPrimaryRole);

// ✅ Get users by role
router.get("/role/:roleId/users", authenticate, userJobRole.getUsersByRole);

export default router;