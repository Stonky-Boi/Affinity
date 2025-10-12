import { Router } from "express";
import authRoutes from "./authRoutes.ts";
import profileRoutes from "./profileRoutes.ts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);

export default router;

