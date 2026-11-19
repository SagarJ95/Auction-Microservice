
import { Router, Response } from "express";

import {
  register,
  login,
  logout,
  refresh
} from "../controllers/auth.controller";

import {
  authenticate,
  AuthRequest
} from "../middleware/auth.middleware";

import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get(
  "/profile",
  authenticate,
  (req: AuthRequest, res: Response) => {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  }
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  (req: AuthRequest, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "Welcome Admin"
    });
  }
);
router.post("/refresh", refresh);

router.post(
  "/logout",
  authenticate,
  logout
);

export default router;