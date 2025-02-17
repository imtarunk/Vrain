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
  // type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

const linkSchema = new mongoose.Schema({
  contentId: { type: String, required: true }, // This is the content's ID
  hash: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export const Tag = mongoose.model("Tag", tagSchema);
export const User = mongoose.model("User", UserSchema);
export const Content = mongoose.model("Content", contentSchema);
export const Link = mongoose.model("Link", linkSchema); // Export the model
