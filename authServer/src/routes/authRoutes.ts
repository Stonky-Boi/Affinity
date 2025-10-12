import { Router } from "express";
import { login, signup } from "../controllers/authControllers.ts"
const router = Router();

router.post("/signup", signup);
router.get("/login", login);

export default router;
