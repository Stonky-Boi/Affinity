import { Router } from "express";
import { authenticateToken } from "../middleware/auth.ts";
import { getProfileById, setProfileById } from "../controllers/profileControllers.ts";

const router = Router();

router.get("/", authenticateToken, getProfileById);
router.post("/", authenticateToken, setProfileById);

export default router;
