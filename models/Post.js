// models/Post.js
import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: String,
  author: String,
  content: String,
  date_created: { type: Date, default: Date.now },
});

export default mongoose.model("Post", PostSchema);
