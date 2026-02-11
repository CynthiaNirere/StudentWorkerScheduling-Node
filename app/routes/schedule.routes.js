import express from "express";
import * as schedules from "../controllers/schedule.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", authenticate, schedules.create);
router.get("/", authenticate, schedules.findAll);
router.get("/:id", authenticate, schedules.findOne);
router.put("/:id", authenticate, schedules.update);
router.delete("/:id", authenticate, schedules.remove);

export default router;