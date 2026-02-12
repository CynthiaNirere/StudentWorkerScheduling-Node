import express from "express";
import * as jobRoles from "../controllers/jobRole.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", authenticate, jobRoles.create);
router.get("/", authenticate, jobRoles.findAll);
router.get("/:id", authenticate, jobRoles.findOne);
router.put("/:id", authenticate, jobRoles.update);
router.delete("/:id", authenticate, jobRoles.remove);

export default router;