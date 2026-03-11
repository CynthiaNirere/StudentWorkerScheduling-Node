import express from "express";
import * as message from "../controllers/message.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// ✅ Message operations
router.post("/", authenticate, message.send);
router.post("/broadcast", authenticate, message.broadcast);
router.get("/inbox", authenticate, message.getInbox);
router.get("/sent", authenticate, message.getSentMessages);
router.get("/unread-count", authenticate, message.getUnreadCount);
router.put("/:id/read", authenticate, message.markAsRead);
router.delete("/:id", authenticate, message.remove);

export default router;