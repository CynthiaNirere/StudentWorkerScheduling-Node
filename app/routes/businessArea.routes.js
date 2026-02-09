import express from "express";
import * as businessAreas from "../controllers/businessArea.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", authenticate, businessAreas.create);
router.get("/", authenticate, businessAreas.findAll);
router.get("/:id", authenticate, businessAreas.findOne);
router.put("/:id", authenticate, businessAreas.update);
router.delete("/:id", authenticate, businessAreas.remove);

export default router;