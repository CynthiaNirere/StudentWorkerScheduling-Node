import express from "express";
import * as admin from "../controllers/admin.controller.js";
//import authenticate from "../authorization/authorization.js";

const router = express.Router();
/*
// ========================================
// USER MANAGEMENT ROUTES
// ========================================
router.post("/users", authenticate, admin.createUser);
router.get("/users", authenticate, admin.getAllUsers);
router.get("/users/:id", authenticate, admin.getUserById);
router.put("/users/:id", authenticate, admin.updateUser);
router.delete("/users/:id", authenticate, admin.deleteUser);

// ========================================
// BUSINESS AREA ROUTES
// ========================================
router.post("/business-areas", authenticate, admin.createBusinessArea);
router.get("/business-areas", authenticate, admin.getAllBusinessAreas);
router.get("/business-areas/:id", authenticate, admin.getBusinessAreaById);
router.put("/business-areas/:id", authenticate, admin.updateBusinessArea);
router.delete("/business-areas/:id", authenticate, admin.deleteBusinessArea);

// ========================================
// JOB ROLE ROUTES
// ========================================
router.post("/job-roles", authenticate, admin.createJobRole);
router.get("/job-roles", authenticate, admin.getAllJobRoles);
router.get("/job-roles/:id", authenticate, admin.getJobRoleById);
router.put("/job-roles/:id", admin.updateJobRole);
router.delete("/job-roles/:id", authenticate, admin.deleteJobRole);
*/

// ========================================
// USER MANAGEMENT ROUTES
// ========================================
router.post("/users", admin.createUser);
router.get("/users", admin.getAllUsers);
router.get("/users/:id", admin.getUserById);
router.put("/users/:id", admin.updateUser);
router.delete("/users/:id", admin.deleteUser);

// ========================================
// BUSINESS AREA ROUTES
// ========================================
router.post("/business-areas", admin.createBusinessArea);
router.get("/business-areas", admin.getAllBusinessAreas);
router.get("/business-areas/:id", admin.getBusinessAreaById);
router.put("/business-areas", admin.updateBusinessArea);
router.delete("/business-areas/:id", admin.deleteBusinessArea);

// ========================================
// JOB ROLE ROUTES
// ========================================
router.post("/job-roles", admin.createJobRole);
router.get("/job-roles", admin.getAllJobRoles);
router.get("/job-roles/:id", admin.getJobRoleById);
router.put("/job-roles/:id", admin.updateJobRole);
router.delete("/job-roles/:id", admin.deleteJobRole);


export default router;