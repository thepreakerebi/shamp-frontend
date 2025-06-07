"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";

export const createAccountAction = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (_ctx, args) => {
    const jwtSecret = process.env.JWT_SECRET!;
    const frontendUrl = process.env.FRONTEND_URL!;
    // Hash password
    const hashedPassword = await bcrypt.hash(args.password, 10);
    // Generate verification token
    const verificationToken = jwt.sign(
      { email: args.email },
      jwtSecret,
      { expiresIn: "1d" } as SignOptions
    );
    // Generate login token
    const loginToken = jwt.sign(
      { email: args.email },
      jwtSecret,
      { expiresIn: "7d" } as SignOptions
    );
    // Verification email HTML
    const verificationHtml = `<p>Click the link to verify your email: <a href='${frontendUrl}/verify?token=${verificationToken}'>Verify Email</a></p>`;
    return {
      hashedPassword,
      verificationToken,
      loginToken,
      verificationHtml,
    };
  },
}); 