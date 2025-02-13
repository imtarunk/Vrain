import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
declare module "express" {
  export interface Request {
    user?: { userId: string };
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.jwt_key as string) as {
      userId: string;
    };
    //@ts-ignore
    req.id = decoded._id;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};
