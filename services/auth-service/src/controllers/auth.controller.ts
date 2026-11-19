import { Request, Response } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserToken
} from "../services/auth.service";
import { verifyRefreshToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  registerSchema,
  loginSchema
} from "../validators/auth.validator";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    
    const data = registerSchema.parse(req.body);

    const user = await registerUser(
      data.name,
      data.email,
      data.password
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: user
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await loginUser(
      data.email,
      data.password
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });

  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

export const refresh = async (
  req: Request,
  res: Response
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "Refresh token required"
      });
    }

    const result = await refreshUserToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: result
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token"
    });
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    await logoutUser(req.user.sid);

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
};