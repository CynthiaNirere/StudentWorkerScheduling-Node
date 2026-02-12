import express from "express";
import * as coverage from "../controllers/coverage.contoller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", authenticate, coverage.create);
router.get("/", authenticate, coverage.findAll);
router.get("/:id", authenticate, coverage.findOne);
router.put("/:id", authenticate, coverage.update);
router.delete("/:id", authenticate, coverage.remove);

// Additional routes specific to coverage
router.get("/location/:locationId", authenticate, coverage.findByLocation);
router.get("/jobrole/:jobRoleId", authenticate, coverage.findByJobRole);
router.get("/location/:locationId/day/:dayOfWeek", authenticate, coverage.findByLocationAndDay);

export default router;