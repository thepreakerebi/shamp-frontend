import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { capitalizeName } from "../utils/name";
import { api } from "../_generated/api";

export const createAccount = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    hashedPassword: v.string(),
    profilePicture: v.optional(v.string()),
    invitedBy: v.optional(v.id("users")),
    verificationToken: v.string(),
    loginToken: v.string(),
    verificationHtml: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate email and names (password already validated client-side)
    const firstName = capitalizeName(args.firstName);
    const lastName = capitalizeName(args.lastName);

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) throw new Error(" already exists.");

    // Insert user
    const userId = await ctx.db.insert("users", {
      firstName,
      lastName,
      email: args.email,
      password: args.hashedPassword,
      profilePicture: args.profilePicture,
      provider: "email",
      role: args.invitedBy ? "member" : "admin",
      invitedBy: args.invitedBy ?? undefined,
      emailVerified: false,
      verificationToken: args.verificationToken,
    });

    // Send verification email
    await ctx.scheduler.runAfter(0, api.services.emailService.sendEmail, {
      to: args.email,
      subject: "Verify your email address",
      html: args.verificationHtml,
    });

    // Return userId and loginToken
    return { userId, token: args.loginToken };
  },
}); 