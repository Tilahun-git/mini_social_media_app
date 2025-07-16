import Post from "../models/Post.js";
import multer from "multer";
import fs from 'fs';
import path from 'path';

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";
    }
    const author = {
      _id: req.user._id,
      username: req.user.username,
      fullName: req.user.firstName + ' ' + req.user.lastName
    };
    const newPost = new Post({
      text,
      media: mediaUrl,
      mediaType,
      author
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to like post" });
  }
};

export const addComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const username = req.user?.username || "Anonymous";
  if (!text) return res.status(400).json({ error: 'Text is required' });
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comment = { text, username, createdAt: new Date() };
    post.comments.push(comment);
    await post.save();
    const savedComment = post.comments[post.comments.length - 1];
    res.status(201).json(savedComment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You are not authorized to delete this post" });
    }
    if (post.media && post.media.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), post.media.startsWith('/') ? post.media.slice(1) : post.media);
      fs.unlink(filePath, (err) => {});
    }
    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );
    if (commentIndex === -1) return res.status(404).json({ error: "Comment not found" });
    post.comments.splice(commentIndex, 1);
    await post.save();
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You are not authorized to edit this post" });
    }
    if (req.body.text !== undefined) {
      post.text = req.body.text;
    }
    if (req.file) {
      if (post.media && post.media.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), post.media.startsWith('/') ? post.media.slice(1) : post.media);
        fs.unlink(filePath, (err) => {});
      }
      post.media = `/uploads/${req.file.filename}`;
      post.mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";
    }
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to update post" });
  }
};
