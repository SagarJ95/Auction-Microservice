
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AccessPayload {
  userId: number;
  role: string;
  sid: string;
}

export interface RefreshPayload {
  userId: number;
  sid: string;
  jti: string;
}

export const generateAccessToken = (
  userId: number,
  role: string,
  sid: string
): string => {
  return jwt.sign(
    { userId, role, sid },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (
  userId: number,
  sid: string,
  jti: string
): string => {
  return jwt.sign(
    { userId, sid, jti },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

export const generateTokenId = (): string => {
  return randomUUID();
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
};
