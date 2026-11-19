
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import dotenv from 'dotenv'
dotenv.config()
import { redis } from "../config/redis";
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    sid: string;
  };
}

export const authenticate = async(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(
      token) as {
      userId: number;
      role: string;
      sid: string;
    };

    // Check Redis session
    const session = await redis.get(
      `auth:session:${decoded.sid}`
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or logged out"
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      sid: decoded.sid
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token"
    });
  }
};
