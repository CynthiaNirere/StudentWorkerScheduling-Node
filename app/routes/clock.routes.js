import express from "express";
import * as clock from "../controllers/clock.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/clock-in",        authenticate, clock.clockIn);
router.put("/clock-out/:id",    authenticate, clock.clockOut);
router.get("/",                 authenticate, clock.findAll);
router.get("/:id",              authenticate, clock.findOne);
router.delete("/:id",           authenticate, clock.remove);
router.put("/:id/approve",      authenticate, clock.approve);
router.put("/:id/reject",       authenticate, clock.reject);
router.put("/:id/modify",       authenticate, clock.modify);

export default router;