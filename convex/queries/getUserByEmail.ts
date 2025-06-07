import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      password: v.string(),
      role: v.union(v.literal("admin"), v.literal("member")),
      emailVerified: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      password: user.password ?? "",
      role: user.role,
      emailVerified: user.emailVerified === undefined ? false : user.emailVerified,
    };
  },
}); 