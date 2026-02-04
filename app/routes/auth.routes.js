import auth from "../controllers/auth.controller.js";
import { Router } from "express";

var router = Router();

router.post("/login", auth.login);
//router.post("/signup", auth.signup);  // ADD THIS LINE
router.post("/logout", auth.logout);

export default router;