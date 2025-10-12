import { Router } from "express";
import { authenticateToken } from "../middleware/auth.ts";
import { getProfileById } from "../controllers/profileControllers.ts";

const router = Router();

router.get("/", authenticateToken, getProfileById);

export default router;
