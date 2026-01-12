import 'dotenv/config'; // automatically loads .env
import path from 'path';
import { fileURLToPath } from 'url';

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";

import postRoutes from "./routes/post.js";
import authRoutes from "./routes/auth.js";

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ Session middleware MUST come before routes that use req.session
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes AFTER session middleware
app.use("/auth", authRoutes);
app.use("/api/posts", postRoutes);

// Connect MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
