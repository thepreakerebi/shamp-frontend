import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { ResendEmailVerificationOTP, ResendPasswordResetOTP } from "./services/emailService";


// Email validation schema
const EmailSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  profilePicture: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
  invitedBy: z.string().optional(),
});

// Custom password validation
function validatePasswordRequirements(password: string) {
  // Define allowed special characters
  const specialCharRegex = /[!@#$%^&*()_\-+=]/;
  if (
    password.length < 8 ||
    !/\d/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !specialCharRegex.test(password) // must include at least one allowed special character
  ) {
    throw new ConvexError("Password must be at least 8 characters, include a number, a lowercase, an uppercase letter, and a special character (!@#$%^&*()_-+=).");
  }
}


export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      async profile(profile) {
        // Extract profile picture and names from Google profile
        const extra: Record<string, string> = {};
        if (typeof profile.picture === "string") {
          extra.profilePicture = profile.picture;
        }
        if (typeof profile.given_name === "string") {
          extra.firstName = profile.given_name;
        }
        if (typeof profile.family_name === "string") {
          extra.lastName = profile.family_name;
        }
        // Determine role and invitedBy
        let role: "admin" | "member" = "admin";
        let invitedBy: string | undefined = undefined;
        if (typeof profile.invitedBy === "string") {
          role = "member";
          invitedBy = profile.invitedBy;
        }
        if (invitedBy) extra.invitedBy = invitedBy;
        extra.role = role;
        // Google always provides email
        return { email: profile.email, ...extra };
      },
    }),
    Password({
      profile(params) {
        const result = EmailSchema.safeParse(params);
        if (!result.success) throw new ConvexError(result.error.format());
        const data = result.data;

        // Determine role
        let role: "admin" | "member" = "admin";
        let invitedBy: string | undefined = undefined;
        if (data.invitedBy) {
          role = "member";
          invitedBy = data.invitedBy;
        }

        // Only return defined string fields, with explicit email property
        const extra: Record<string, string> = {};
        if (typeof data.firstName === "string") extra.firstName = data.firstName;
        if (typeof data.lastName === "string") extra.lastName = data.lastName;
        if (invitedBy) extra.invitedBy = invitedBy;
        extra.role = role;

        return { email: data.email, ...extra };
      },
      validatePasswordRequirements,
      verify: ResendEmailVerificationOTP, // Require email verification
      reset: ResendPasswordResetOTP, // Password reset OTP
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Check if a user with this email already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingUser = await (ctx.db as any)
        .query("users")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_email", (q: any) => q.eq("email", args.profile.email))
        .unique();

      if (existingUser) {
        // Check authAccounts for this user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authAccounts = await (ctx.db as any)
          .query("authAccounts")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_userId", (q: any) => q.eq("userId", existingUser._id))
          .collect();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasGoogle = authAccounts.some((acc: any) => acc.providerId === "google");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasPassword = authAccounts.some((acc: any) => acc.providerId === "password");

        if (args.type === "email" && hasGoogle && !hasPassword) {
          throw new Error(
            "You already created an account with Google for this email. Please log in with Google or use the 'Forgot password' flow to set a password for this account."
          );
        }
        if (args.type === "oauth" && hasPassword && !hasGoogle) {
          throw new Error(
            "You already created an account with email/password for this email. Please log in with your password or use the 'Sign in with Google' button."
          );
        }
        // Otherwise, link the account
        return existingUser._id;
      }

      // No existing user, create a new one
      return ctx.db.insert("users", {
        ...args.profile,
      });
    },
  },
});