import mongoose from "mongoose";

const dislikeSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  session_name: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Dislike", dislikeSchema);
