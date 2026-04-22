import express from "express";
import * as controller from "../controllers/taskAssignment.controller.js";

const router = express.Router();

// Employee: get my tasks for today only
router.get("/my-today",        controller.getMyToday);

// Employer: audit views
router.get("/yesterday",       controller.getYesterdayAudit);
router.get("/today",           controller.getToday);
router.get("/date/:timestamp", controller.getByDate);

// Assignment management
router.post("/",               controller.create);
router.post("/bulk",           controller.bulkCreate);
router.delete("/:id",         controller.remove);

export default router;