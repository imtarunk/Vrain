import express, { json } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Content, User } from "./model/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./middleware/auth";

dotenv.config();
const app = express();
const port = process.env.port || 5000;
app.use(express.json());

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

  //   if (!link || !type || !title || !tags) {
  //     res.status(403).json({
  //       message: "Please provide all required fields",
  //     });
  //     return;
  //   }

  try {
    const data = await Content.create({
      link,
      title,
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

app.get("/api/v1/content", (req, res) => {});

app.post("/api/v1/vrain/share", (req, res) => {});

app.get("/api/v1/vrain/:shareLink", (req, res) => {});

function main() {
  mongoose
    .connect(process.env.uri as string)
    .then(() => console.log("Database Connected!"));

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
}

main();

// 6cqL0HjXuSfdpNL0
