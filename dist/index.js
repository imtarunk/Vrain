"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const schema_1 = require("./model/schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./middleware/auth");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.port || 5000;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://vrain.codextarun.xyz",
        "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res
            .status(400)
            .json({ message: "Please provide both username and password" });
        return;
    }
    try {
        const exestingUser = yield schema_1.User.findOne({
            username: username, // check if username already exists
        });
        if (exestingUser) {
            res.status(400).json({
                message: "Username already exists", // if username exists, return this message
            });
            return;
        }
        const hashPassword = yield bcryptjs_1.default.hash(password, 5);
        const user = schema_1.User.create({
            username: username,
            password: hashPassword,
        });
        res.status(200).json({
            message: "User created successfully",
            user: (yield user)._id,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(403).json({
            message: "Please provide both username and password",
        });
        return;
    }
    try {
        const user = yield schema_1.User.findOne({ username: username });
        if (!user) {
            res.status(403).json({
                message: "User not found",
            });
            return;
        }
        const isValidPassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            res.status(403).json({
                message: "Invalid password",
            });
        }
        const token = jsonwebtoken_1.default.sign({ _id: user._id }, process.env.jwt_key);
        res.status(200).json({
            message: "User signed in successfully",
            token: token,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
app.post("/api/v1/content", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = req.body.link;
    const title = req.body.title;
    const type = req.body.type;
    const description = req.body.description;
    try {
        const data = yield schema_1.Content.create({
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
    }
    catch (err) {
        console.log(err);
    }
}));
app.get("/api/v1/content", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = yield req.id;
    console.log(userId);
    try {
        const data = yield schema_1.Content.find({
            userId: userId,
        });
        res.status(200).json({
            message: "successfully",
            Content: data,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
app.post("/api/v1/vrain/share", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const hash = yield bcryptjs_1.default.hash(String(contentId), 2);
        const shortLink = hash.slice(0, 9);
        const hashlink = yield schema_1.Link.create({
            contentId,
            hash: shortLink,
            status, // default status is true
            userId,
        });
        res.status(200).json({
            message: "Content shared successfully",
            data: hashlink,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
app.get("/api/v1/vrain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shareLink } = req.params;
    if (!shareLink) {
        res.status(400).json({
            message: "Invalid share link",
        });
        return;
    }
    try {
        const isValid = yield schema_1.Link.find({
            hash: shareLink,
        });
        if (!isValid) {
            res.status(404).json({
                message: "Content not found",
            });
            return;
        }
        const contentId = isValid[0].contentId;
        const data = yield schema_1.Content.findOne({
            _id: contentId,
        });
        res.status(200).json({
            message: "Content found",
            data,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
app.get("/api/v1/all-links", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.id; // Extract user ID from the request
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        // Fetch links belonging to the user
        const data = yield schema_1.Link.find({ userId });
        if (!data || data.length === 0) {
            res.status(404).json({ message: "No links found" });
        }
        res.status(200).json({
            message: "Links found",
            data,
        });
    }
    catch (err) {
        console.error("Error fetching links:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// Note endpoints
app.post("/api/v1/notes", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content, tags, isPublic } = req.body;
    try {
        if (!title || !content) {
            res.status(400).json({ message: "Title and content are required" });
            return;
        }
        const note = yield schema_1.Note.create({
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
    }
    catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Failed to create note" });
    }
}));
app.get("/api/v1/notes", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notes = yield schema_1.Note.find({ userId: req.id })
            .sort({ updatedAt: -1 })
            .limit(10);
        const sharedNotes = yield schema_1.Permission.find({ userId: req.id })
            .populate("noteId")
            .sort({ createdAt: -1 })
            .limit(10);
        res.status(200).json({
            message: "Notes fetched successfully",
            notes,
            sharedNotes: sharedNotes.map((p) => p.noteId),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching notes" });
    }
}));
// Add GET endpoint for single note
app.get("/api/v1/notes/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log("Fetching note with ID:", id);
    console.log("User ID from token:", req.id);
    try {
        // First check if user owns the note
        const note = yield schema_1.Note.findOne({ _id: id, userId: req.id });
        console.log("Note found by ownership:", note ? "Yes" : "No");
        if (note) {
            res.status(200).json({ note });
            return;
        }
        // If not owner, check if note is public
        const publicNote = yield schema_1.Note.findOne({ _id: id, isPublic: true });
        console.log("Public note found:", publicNote ? "Yes" : "No");
        if (publicNote) {
            res.status(200).json({ note: publicNote });
            return;
        }
        // If not public, check if user has permission
        const permission = yield schema_1.Permission.findOne({ noteId: id, userId: req.id });
        console.log("Permission found:", permission ? "Yes" : "No");
        if (permission) {
            const sharedNote = yield schema_1.Note.findById(id);
            res.status(200).json({ note: sharedNote });
            return;
        }
        console.log("Note not found or user doesn't have access");
        res.status(404).json({ message: "Note not found" });
    }
    catch (err) {
        console.error("Error in GET /api/v1/notes/:id:", err);
        res.status(500).json({ message: "Error fetching note" });
    }
}));
app.put("/api/v1/notes/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, content, tags, isPublic } = req.body;
    try {
        const note = yield schema_1.Note.findOne({ _id: id, userId: req.id });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        const updatedNote = yield schema_1.Note.findByIdAndUpdate(id, { title, content, tags, isPublic, updatedAt: Date.now() }, { new: true });
        res.status(200).json({
            message: "Note updated successfully",
            note: updatedNote,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating note" });
    }
}));
app.delete("/api/v1/notes/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const note = yield schema_1.Note.findOne({ _id: id, userId: req.id });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        yield schema_1.Note.findByIdAndDelete(id);
        yield schema_1.Permission.deleteMany({ noteId: id });
        res.status(200).json({ message: "Note deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting note" });
    }
}));
// Permission endpoints
app.post("/api/v1/notes/:id/share", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId, permissionType } = req.body;
    try {
        const note = yield schema_1.Note.findOne({ _id: id, userId: req.id });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        const permission = yield schema_1.Permission.create({
            noteId: id,
            userId,
            permissionType,
        });
        res.status(201).json({
            message: "Permission granted successfully",
            permission,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error sharing note" });
    }
}));
app.get("/api/v1/notes/:id/permissions", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const note = yield schema_1.Note.findOne({ _id: id, userId: req.id });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        const permissions = yield schema_1.Permission.find({ noteId: id }).populate("userId", "username");
        res.status(200).json({
            message: "Permissions fetched successfully",
            permissions,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching permissions" });
    }
}));
function main() {
    mongoose_1.default
        .connect(process.env.uri)
        .then(() => console.log("Database Connected!"));
    app.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });
}
app.delete("/api/v1/delete/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "ID is required" });
        return;
    }
    try {
        const data = yield schema_1.Content.findByIdAndDelete(id);
        res.status(200).json({ message: "Content deleted successfully" });
    }
    catch (err) {
        console.log(err);
    }
}));
app.get("/*", (req, res) => {
    res.status(404).json({ message: "Page not found" });
});
main();
// 6cqL0HjXuSfdpNL0
