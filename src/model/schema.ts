import mongoose, { Schema } from "mongoose";

const contentTypes = ["image", "video", "article", "audio"]; // Extend as needed

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const tagSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
});

const contentSchema = new Schema({
  link: { type: String, required: true },
  type: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

const linkSchema = new mongoose.Schema({
  contentId: { type: String, required: true }, // Assuming unique contentId
  hash: { type: String, required: true },
  status: { type: Boolean, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

// New schemas for notes and permissions
const noteSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  isPublic: { type: Boolean, default: false },
});

const permissionSchema = new Schema({
  noteId: { type: mongoose.Types.ObjectId, ref: "Note", required: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  permissionType: {
    type: String,
    enum: ["view", "edit", "admin"],
    default: "view",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Tag = mongoose.model("Tag", tagSchema);
export const User = mongoose.model("User", UserSchema);
export const Content = mongoose.model("Content", contentSchema);
export const Link = mongoose.model("Link", linkSchema); // Export the model
export const Note = mongoose.model("Note", noteSchema);
export const Permission = mongoose.model("Permission", permissionSchema);
