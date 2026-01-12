// models/Like.js
import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  session_name: String,
});

export default mongoose.model("Like", LikeSchema);
