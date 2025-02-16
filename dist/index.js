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
app.use((0, cors_1.default)());
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
    try {
        const data = yield schema_1.Content.create({
            link,
            title,
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
    const { contentId } = req.body; // Extract contentId properly
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
function main() {
    mongoose_1.default
        .connect(process.env.uri)
        .then(() => console.log("Database Connected!"));
    app.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });
}
main();
// 6cqL0HjXuSfdpNL0
