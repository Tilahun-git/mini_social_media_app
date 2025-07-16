import express from "express";
import multer from "multer";
import {
  createPost,
  getPosts,
  likePost,
  addComment,
  deletePost,
  deleteComment,
  updatePost
} from "../controllers/postController.js";
import { protect } from "../controllers/authMiddleware.js";

const postRouter = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

postRouter.post("/create-post", protect, upload.single("media"), createPost);
postRouter.get("/", getPosts);
postRouter.post("/like/:id", likePost);
postRouter.post('/:id/comments', protect, addComment);
postRouter.put("/:id", protect, upload.single("media"), updatePost);
postRouter.delete('/:id', protect, deletePost);
postRouter.delete('/:postId/comments/:commentId', protect, deleteComment);

export default postRouter;
