import auth from "../controllers/auth.controller.js";
import { Router } from "express";
import authenticate from "../authorization/authorization.js";

var router = Router();

router.post("/login",              auth.login);
router.post("/logout",             auth.logout);
router.post("/impersonate",        authenticate, auth.impersonate);
router.post("/exit-impersonation", authenticate, auth.exitImpersonation);

export default router;