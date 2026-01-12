import express from "express";
import Post from "../models/Post.js";
import Like from "../models/Like.js";
import Dislike from "../models/Dislike.js";
import Comment from "../models/Comment.js";

const router = express.Router();

// Ensure session
router.use((req, res, next) => {
  if (!req.session.session_name) {
    req.session.session_name = "guest";
  }
  next();
});

// GET posts with likes, dislikes, comments
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ date_created: -1 }).lean();

    const enriched = await Promise.all(
      posts.map(async post => {
        const likes = await Like.countDocuments({ post_id: post._id });
        const dislikes = await Dislike.countDocuments({ post_id: post._id });

        const is_liked = await Like.findOne({
          post_id: post._id,
          session_name: req.session.session_name,
        });

        const is_disliked = await Dislike.findOne({
          post_id: post._id,
          session_name: req.session.session_name,
        });

        const comments = await Comment.find({ post_id: post._id })
          .sort({ createdAt: 1 })
          .lean();

        return {
          ...post,
          likes,
          dislikes,
          is_liked: !!is_liked,
          is_disliked: !!is_disliked,
          comments,
        };
      })
    );

    res.json({
      session_name: req.session.session_name,
      posts: enriched,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ADD POST (logged-in only)
router.post("/", async (req, res) => {
  if (req.session.session_name === "guest") {
    return res.status(401).json({ error: "Login required" });
  }

  const { title, content } = req.body;
  const author = req.session.session_name;

  const post = new Post({ title, content, author });
  await post.save();

  res.json({ success: true });
});

// ADD COMMENT
router.post("/comment/:id", async (req, res) => {
  if (req.session.session_name === "guest") {
    return res.status(401).json({ error: "Login required" });
  }

  const { id } = req.params;
  const { text } = req.body;

  const comment = new Comment({
    post_id: id,
    author: req.session.session_name,
    text,
  });

  await comment.save();
  res.json({ success: true });
});

// LIKE / UNLIKE
router.post("/like/:id", async (req, res) => {
  if (req.session.session_name === "guest") {
    return res.status(401).json({ error: "Login required" });
  }

  const { id } = req.params;
  const session_name = req.session.session_name;

  await Dislike.deleteOne({ post_id: id, session_name });

  const existing = await Like.findOne({ post_id: id, session_name });
  if (existing) {
    await existing.deleteOne();
    return res.json({ liked: false });
  }

  await Like.create({ post_id: id, session_name });
  res.json({ liked: true });
});

// DISLIKE / UNDISLIKE
router.post("/dislike/:id", async (req, res) => {
  if (req.session.session_name === "guest") {
    return res.status(401).json({ error: "Login required" });
  }

  const { id } = req.params;
  const session_name = req.session.session_name;

  await Like.deleteOne({ post_id: id, session_name });

  const existing = await Dislike.findOne({ post_id: id, session_name });
  if (existing) {
    await existing.deleteOne();
    return res.json({ disliked: false });
  }

  await Dislike.create({ post_id: id, session_name });
  res.json({ disliked: true });
});

// DELETE POST (and cleanup)
router.delete("/delete/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.json({ success: false });

  if (post.author !== req.session.session_name) {
    return res.status(403).json({ error: "Not allowed" });
  }

  await post.deleteOne();
  await Like.deleteMany({ post_id: post._id });
  await Dislike.deleteMany({ post_id: post._id });
  await Comment.deleteMany({ post_id: post._id });

  res.json({ success: true });
});

export default router;
