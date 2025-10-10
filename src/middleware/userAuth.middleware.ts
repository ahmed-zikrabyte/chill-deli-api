import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserModel } from "../models/user.model";
import { ApiResponse } from "../utils/response.util";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userRole?: string;
    }
  }
}

/**
 * Protect User Routes
 * Verifies token and attaches user to req
 */
export const protectUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return ApiResponse.unauthorized({
        res,
        message: "Not authorized — token missing",
      });
    }

    const decoded = jwt.verify(token, ENV.jwt.secret) as jwt.JwtPayload;

    const userDoc = await UserModel.findById(decoded.id);
    if (!userDoc) {
      return ApiResponse.unauthorized({
        res,
        message: "User not found",
      });
    }

    req.user = userDoc;
    req.userRole = userDoc.role;

    next();
  } catch (error: any) {
    console.error("User Auth Error:", error);

    if (error.name === "TokenExpiredError") {
      return ApiResponse.unauthorized({
        res,
        message: "Token expired. Please log in again.",
        error,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return ApiResponse.unauthorized({
        res,
        message: "Invalid token. Please log in again.",
        error,
      });
    }

    return ApiResponse.error({
      res,
      message: "Authentication failed. Please try again.",
      error,
    });
  }
};

/**
 * Restrict user routes by role (if you ever have multiple roles)
 * Usage: restrictUserTo('user')
 */
export const restrictUserTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized({
        res,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.userRole!)) {
      return ApiResponse.forbidden({
        res,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
