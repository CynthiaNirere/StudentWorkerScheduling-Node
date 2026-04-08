import express from "express";
import * as admin from "../controllers/admin.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// ── Admin-only guard middleware ────────────────────────────────────────────
// Runs after authenticate. Blocks anyone whose DB role is not 'admin'.
// This prevents employers from calling /admin/* routes directly.
const requireAdmin = (req, res, next) => {
  const role = req.user?.actualRole || req.user?.role;
  if (role !== 'admin') {
    console.warn(`⛔ Non-admin attempted to access admin route: ${req.user?.email} (${role})`);
    return res.status(403).send({ message: "Admin access required." });
  }
  next();
};

// ========================================
// USER MANAGEMENT ROUTES
// ========================================
router.post("/users",     authenticate, requireAdmin, admin.createUser);
router.get("/users",      authenticate, requireAdmin, admin.getAllUsers);
router.get("/users/:id",  authenticate, requireAdmin, admin.getUserById);
router.put("/users/:id",  authenticate, requireAdmin, admin.updateUser);
router.delete("/users/:id", authenticate, requireAdmin, admin.deleteUser);

// ========================================
// BUSINESS AREA ROUTES
// ========================================
router.post("/business-areas",      authenticate, requireAdmin, admin.createBusinessArea);
router.get("/business-areas",       authenticate, requireAdmin, admin.getAllBusinessAreas);
router.get("/business-areas/:id",   authenticate, requireAdmin, admin.getBusinessAreaById);
router.put("/business-areas/:id",   authenticate, requireAdmin, admin.updateBusinessArea);
router.delete("/business-areas/:id", authenticate, requireAdmin, admin.deleteBusinessArea);

// ========================================
// JOB ROLE ROUTES
// ========================================
router.post("/job-roles",      authenticate, requireAdmin, admin.createJobRole);
router.get("/job-roles",       authenticate, requireAdmin, admin.getAllJobRoles);
router.get("/job-roles/:id",   authenticate, requireAdmin, admin.getJobRoleById);
router.put("/job-roles/:id",   authenticate, requireAdmin, admin.updateJobRole);
router.delete("/job-roles/:id", authenticate, requireAdmin, admin.deleteJobRole);

export default router;