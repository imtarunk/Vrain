import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Content, Link, User } from "./model/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./middleware/auth";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.port || 5000;
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://vrain.codextarun.xyz",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

interface userIn {
  userId: string;
}

app.post("/api/v1/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res
      .status(400)
      .json({ message: "Please provide both username and password" });
    return;
  }
  try {
    const exestingUser = await User.findOne({
      username: username, // check if username already exists
    });

    if (exestingUser) {
      res.status(400).json({
        message: "Username already exists", // if username exists, return this message
      });
      return;
    }

    const hashPassword = await bcrypt.hash(password, 5);

    const user = User.create({
      username: username,
      password: hashPassword,
    });

    res.status(200).json({
      message: "User created successfully",
      user: (await user)._id,
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(403).json({
      message: "Please provide both username and password",
    });
    return;
  }

  try {
    const user = await User.findOne({ username: username });

    if (!user) {
      res.status(403).json({
        message: "User not found",
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(403).json({
        message: "Invalid password",
      });
    }
    const token = jwt.sign({ _id: user._id }, process.env.jwt_key as string);
    res.status(200).json({
      message: "User signed in successfully",
      token: token,
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/v1/content", authenticateToken, async (req, res) => {
  const link = req.body.link;
  const title = req.body.title;
  const type = req.body.type;
  const description = req.body.description;

  try {
    const data = await Content.create({
      link,
      title,
      type,
      description,
      tags: [], //@ts-ignore
      userId: req.id,
    });

    res.status(201).json({
      message: "Content created successfully",
      data: data,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/v1/content", authenticateToken, async (req, res) => {
  //@ts-ignore
  const userId = await req.id;
  console.log(userId);

  try {
    const data = await Content.find({
      userId: userId,
    });
    res.status(200).json({
      message: "successfully",
      Content: data,
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/v1/vrain/share", authenticateToken, async (req, res) => {
  const { contentId, status } = req.body; // Extract contentId properly
  if (!contentId) {
    res.status(400).json({ message: "contentId is required" });
    return;
  }
  //@ts-ignore
  const userId = req.id;

  console.log("User ID:", userId);
  console.log("Content ID:", contentId);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const hash = await bcrypt.hash(String(contentId), 2);
    const shortLink = hash.slice(0, 9);
    const hashlink = await Link.create({
      contentId,
      hash: shortLink,
      status, // default status is true
      userId,
    });
    res.status(200).json({
      message: "Content shared successfully",
      data: hashlink,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/v1/vrain/:shareLink", async (req, res) => {
  const { shareLink } = req.params;
  if (!shareLink) {
    res.status(400).json({
      message: "Invalid share link",
    });
    return;
  }
  try {
    const isValid = await Link.find({
      hash: shareLink,
    });

    if (!isValid) {
      res.status(404).json({
        message: "Content not found",
      });
      return;
    }

    const contentId = isValid[0].contentId;
    const data = await Content.findOne({
      _id: contentId,
    });
    res.status(200).json({
      message: "Content found",
      data,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/v1/all-links", authenticateToken, async (req, res) => {
  //@ts-ignore
  const userId = req.id; // Extract user ID from the request

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    // Fetch links belonging to the user
    const data = await Link.find({ userId });
    if (!data || data.length === 0) {
      res.status(404).json({ message: "No links found" });
    }

    res.status(200).json({
      message: "Links found",
      data,
    });
  } catch (err) {
    console.error("Error fetching links:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

function main() {
  mongoose
    .connect(process.env.uri as string)
    .then(() => console.log("Database Connected!"));

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
}

app.delete("/api/v1/delete/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: "ID is required" });
    return;
  }
  try {
    const data = await Content.findByIdAndDelete(id);
    res.status(200).json({ message: "Content deleted successfully" });
  } catch (err) {
    console.log(err);
  }
});

app.get("/*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

main();

// 6cqL0HjXuSfdpNL0
