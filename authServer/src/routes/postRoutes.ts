import { Router } from "express";
import * as postControllers from "../controllers/postController.ts"
import { authenticateToken } from "src/middleware/auth.ts";
const router = Router();

router.post("/", authenticateToken, postControllers.createPost);
router.get("/", authenticateToken, postControllers.getPosts);
router.post("/:postId/comments", authenticateToken, postControllers.makeCommentOnPost);
router.get("/:postId/comments", authenticateToken, postControllers.getCommentsOnPost);
router.post("/:postId/reactions", authenticateToken, postControllers.makeReactionOnPost);
router.get("/:postId/reactions", authenticateToken, postControllers.getReactions);

export default router;
