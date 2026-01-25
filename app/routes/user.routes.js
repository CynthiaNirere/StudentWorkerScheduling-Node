import express from "express";
import * as users from "../controllers/user.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();


router.post("/", authenticate, users.create);
router.get("/", authenticate, users.findAll);
router.get("/:id", authenticate, users.findOne);
router.put("/:id", authenticate, users.update);
router.delete("/:id", authenticate, users.remove);


router.get("/email/:email", authenticate, users.findByEmail);

export default router;
