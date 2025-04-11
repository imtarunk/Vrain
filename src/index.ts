import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Content, Link, User, Note, Permission } from "./model/schema";
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

// Note endpoints
app.post("/api/v1/notes", authenticateToken, async (req, res) => {
  const { title, content, tags, isPublic } = req.body;
  try {
    if (!title || !content) {
      res.status(400).json({ message: "Title and content are required" });
      return;
    }

    const note = await Note.create({
      title,
      content,
      tags: tags || [],
      isPublic: isPublic || false,
      userId: req.id,
    });

    res.status(201).json({
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Failed to create note" });
  }
});

app.get("/api/v1/notes", authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.id })
      .sort({ updatedAt: -1 })
      .limit(10);

    const sharedNotes = await Permission.find({ userId: req.id })
      .populate("noteId")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      message: "Notes fetched successfully",
      notes,
      sharedNotes: sharedNotes.map((p) => p.noteId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching notes" });
  }
});

// Add GET endpoint for single note
app.get("/api/v1/notes/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log("Fetching note with ID:", id);
  console.log("User ID from token:", req.id);

  try {
    // First check if user owns the note
    const note = await Note.findOne({ _id: id, userId: req.id });
    console.log("Note found by ownership:", note ? "Yes" : "No");

    if (note) {
      res.status(200).json({ note });
      return;
    }

    // If not owner, check if note is public
    const publicNote = await Note.findOne({ _id: id, isPublic: true });
    console.log("Public note found:", publicNote ? "Yes" : "No");

    if (publicNote) {
      res.status(200).json({ note: publicNote });
      return;
    }

    // If not public, check if user has permission
    const permission = await Permission.findOne({ noteId: id, userId: req.id });
    console.log("Permission found:", permission ? "Yes" : "No");

    if (permission) {
      const sharedNote = await Note.findById(id);
      res.status(200).json({ note: sharedNote });
      return;
    }

    console.log("Note not found or user doesn't have access");
    res.status(404).json({ message: "Note not found" });
  } catch (err) {
    console.error("Error in GET /api/v1/notes/:id:", err);
    res.status(500).json({ message: "Error fetching note" });
  }
});

app.put(
  "/api/v1/notes/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, content, tags, isPublic } = req.body;

    try {
      const note = await Note.findOne({ _id: id, userId: req.id });
      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      const updatedNote = await Note.findByIdAndUpdate(
        id,
        { title, content, tags, isPublic, updatedAt: Date.now() },
        { new: true }
      );

      res.status(200).json({
        message: "Note updated successfully",
        note: updatedNote,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating note" });
    }
  }
);

app.delete(
  "/api/v1/notes/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const note = await Note.findOne({ _id: id, userId: req.id });
      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      await Note.findByIdAndDelete(id);
      await Permission.deleteMany({ noteId: id });

      res.status(200).json({ message: "Note deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error deleting note" });
    }
  }
);

// Permission endpoints
app.post(
  "/api/v1/notes/:id/share",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { userId, permissionType } = req.body;

    try {
      const note = await Note.findOne({ _id: id, userId: req.id });
      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      const permission = await Permission.create({
        noteId: id,
        userId,
        permissionType,
      });

      res.status(201).json({
        message: "Permission granted successfully",
        permission,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error sharing note" });
    }
  }
);

app.get(
  "/api/v1/notes/:id/permissions",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const note = await Note.findOne({ _id: id, userId: req.id });
      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      const permissions = await Permission.find({ noteId: id }).populate(
        "userId",
        "username"
      );

      res.status(200).json({
        message: "Permissions fetched successfully",
        permissions,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching permissions" });
    }
  }
);

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
