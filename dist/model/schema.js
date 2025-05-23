"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.Note = exports.Link = exports.Content = exports.User = exports.Tag = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contentTypes = ["image", "video", "article", "audio"]; // Extend as needed
const UserSchema = new mongoose_1.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const tagSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true, unique: true },
});
const contentSchema = new mongoose_1.Schema({
    link: { type: String, required: true },
    type: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: mongoose_1.default.Types.ObjectId, ref: "Tag" }],
    userId: { type: mongoose_1.default.Types.ObjectId, ref: "User", required: true },
});
const linkSchema = new mongoose_1.default.Schema({
    contentId: { type: String, required: true }, // Assuming unique contentId
    hash: { type: String, required: true },
    status: { type: Boolean, required: true },
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
});
// New schemas for notes and permissions
const noteSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    userId: { type: mongoose_1.default.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    tags: [{ type: mongoose_1.default.Types.ObjectId, ref: "Tag" }],
    isPublic: { type: Boolean, default: false },
});
const permissionSchema = new mongoose_1.Schema({
    noteId: { type: mongoose_1.default.Types.ObjectId, ref: "Note", required: true },
    userId: { type: mongoose_1.default.Types.ObjectId, ref: "User", required: true },
    permissionType: {
        type: String,
        enum: ["view", "edit", "admin"],
        default: "view",
    },
    createdAt: { type: Date, default: Date.now },
});
exports.Tag = mongoose_1.default.model("Tag", tagSchema);
exports.User = mongoose_1.default.model("User", UserSchema);
exports.Content = mongoose_1.default.model("Content", contentSchema);
exports.Link = mongoose_1.default.model("Link", linkSchema); // Export the model
exports.Note = mongoose_1.default.model("Note", noteSchema);
exports.Permission = mongoose_1.default.model("Permission", permissionSchema);
