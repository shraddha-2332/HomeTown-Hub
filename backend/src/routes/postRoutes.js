import { Router } from "express";
import {
  addComment,
  createPost,
  deletePost,
  listPosts,
  reportPost,
  togglePostLike,
  updatePost
} from "../controllers/postController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listPosts);
router.post("/", requireAuth, createPost);
router.patch("/:postId", requireAuth, updatePost);
router.delete("/:postId", requireAuth, deletePost);
router.post("/:postId/like", requireAuth, togglePostLike);
router.post("/:postId/report", requireAuth, reportPost);
router.post("/:postId/comments", requireAuth, addComment);

export default router;
