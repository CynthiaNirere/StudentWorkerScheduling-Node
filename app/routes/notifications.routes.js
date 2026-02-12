import express from "express";
import * as notifications from "../controllers/notifications.contoller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", authenticate, notifications.create);
router.get("/", authenticate, notifications.findAll);
router.get("/:id", authenticate, notifications.findOne);
router.put("/:id", authenticate, notifications.update);
router.delete("/:id", authenticate, notifications.remove);

// Additional routes specific to notifications
router.get("/user/:userId", authenticate, notifications.findByUser);
router.put("/read/:id", authenticate, notifications.markAsRead);
router.put("/read-all/user/:userId", authenticate, notifications.markAllAsRead);

export default router;