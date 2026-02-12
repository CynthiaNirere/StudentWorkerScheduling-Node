import express from "express";
import * as clock from "../controllers/clock.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/clock-in", authenticate, clock.clockIn);
router.put("/clock-out/:id", authenticate, clock.clockOut);
router.get("/", authenticate, clock.findAll);
router.get("/user/:userId", authenticate, clock.findByUser);
router.get("/:id", authenticate, clock.findOne);
router.put("/:id", authenticate, clock.update);
router.delete("/:id", authenticate, clock.remove);

export default router;