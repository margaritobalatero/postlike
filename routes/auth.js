import express from "express";
import { randomBytes } from "crypto";
import { ethers } from "ethers";
import User from "../models/User.js";

const router = express.Router();

// Ensure session exists
router.use((req, res, next) => {
  if (!req.session.session_name) {
    req.session.session_name = "guest";
  }
  next();
});

// Get nonce
router.get("/nonce", async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: "Address required" });

  let user = await User.findOne({ address });
  if (!user) {
    const nonce = randomBytes(16).toString("hex");
    user = new User({ address, nonce });
    await user.save();
  }

  res.json({ nonce: user.nonce });
});

// Login
router.post("/login", async (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature)
    return res.status(400).json({ error: "Address and signature required" });

  const user = await User.findOne({ address });
  if (!user) return res.status(404).json({ error: "User not found" });

  const recovered = ethers.verifyMessage(
    `Login nonce: ${user.nonce}`,
    signature
  );

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  user.nonce = randomBytes(16).toString("hex");
  await user.save();

  req.session.session_name = address;

  res.json({ success: true, address });
});

// ✅ LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }

    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
