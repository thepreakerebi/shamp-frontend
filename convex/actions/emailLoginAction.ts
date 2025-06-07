"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";


export const emailLoginAction = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    user: v.object({
      _id: v.id("users"),
      email: v.string(),
      role: v.union(v.literal("admin"), v.literal("member")),
      emailVerified: v.boolean(),
    }),
    token: v.string(),
  }),
  handler: async (ctx, args): Promise<{ user: { _id: Id<"users">; email: string; role: "admin" | "member"; emailVerified: boolean }; token: string }> => {
    const user = await ctx.runQuery(internal.queries.getUserByEmail.getUserByEmail, { email: args.email }) as {
      _id: Id<"users">;
      email: string;
      password: string;
      role: "admin" | "member";
      emailVerified: boolean;
    } | null;
    if (!user) {
      throw new Error("No account found with this email.");
    }
    if (!user.password) {
      throw new Error("This account does not have a password set. Please log in with Google or use 'Forgot password' to set a password.");
    }
    if (!user.emailVerified) {
      throw new Error("Please verify your email address before logging in.");
    }
    const isMatch = await bcrypt.compare(args.password, user.password);
    if (!isMatch) {
      throw new Error("Incorrect password. Please try again.");
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" } as SignOptions
    );
    // Only return safe user fields
    return {
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    };
  },
}); 