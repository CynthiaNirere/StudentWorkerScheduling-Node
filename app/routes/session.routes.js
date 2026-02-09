import express from "express";
import * as sessions from "../controllers/session.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", authenticate, sessions.create);
router.get("/", authenticate, sessions.findAll);
router.get("/:id", authenticate, sessions.findOne);
router.get("/token/:token", authenticate, sessions.findByToken);
router.put("/:id", authenticate, sessions.update);
router.delete("/:id", authenticate, sessions.remove);

export default router;