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
});