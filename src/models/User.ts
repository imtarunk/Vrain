import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  clerk_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerk_id: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    avatar_url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
