import express from "express";
import * as availability from "../controllers/availability.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", authenticate, availability.create);
router.get("/", authenticate, availability.findAll);
router.get("/user/:userId", authenticate, availability.findByUser);
router.get("/:id", authenticate, availability.findOne);
router.put("/:id", authenticate, availability.update);
router.delete("/:id", authenticate, availability.remove);

export default router;