import { Router } from "express";
import authRoutes from "./authRoutes.ts";
import profileRoutes from "./profileRoutes.ts";
import postRoutes from "./postRoutes.ts";
import userRoutes from "./userRoutes.ts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);

export default router;

