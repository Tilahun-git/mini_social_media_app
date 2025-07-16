import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const postSchema = new mongoose.Schema({
  text: { type: String },
  media: { type: String },
  mediaType: { type: String },
  createdAt: { type: Date, default: Date.now },
  likes: {
    type: Number,
    default: 0,
  },
  author: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    fullName: { type: String, required: true }
  },
  comments: [commentSchema]
});

const Post = mongoose.model("Post", postSchema);
export default Post;
