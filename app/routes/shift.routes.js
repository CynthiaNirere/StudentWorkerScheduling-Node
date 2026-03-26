import express from "express";
import * as shifts from "../controllers/shift.controller.js";
import authenticate from "../authorization/authorization.js";
import attachLocation from "../authorization/attachLocation.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", authenticate, shifts.create);
router.get("/", authenticate, attachLocation, shifts.findAll);
router.get("/:id", authenticate, shifts.findOne);
router.put("/:id", authenticate, shifts.update);
router.delete("/:id", authenticate, shifts.remove);

// Special operations
router.put("/:id/assign", authenticate, shifts.assignUser);
router.put("/:id/publish", authenticate, shifts.publish);

export default router;