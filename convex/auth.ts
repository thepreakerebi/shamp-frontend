import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      async profile(profile) {
        // Extract profile picture from Google profile
        const extra: Record<string, string> = {};
        if (typeof profile.picture === "string") {
          extra.profilePicture = profile.picture;
        }
        // Determine fullName
        let fullName: string | undefined = undefined;
        if (typeof profile.name === "string" && profile.name.length > 0) {
          fullName = profile.name;
        } else if (typeof profile.given_name === "string" && typeof profile.family_name === "string" && profile.given_name.length > 0 && profile.family_name.length > 0) {
          fullName = profile.given_name + " " + profile.family_name;
        } else if (typeof profile.email === "string") {
          const emailName = profile.email.split("@")[0];
          fullName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
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
        return { email: profile.email, fullName, ...extra };
      },
    }),
    Resend({
      // No profile callback for Resend; handle in createOrUpdateUser
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      console.log("Profile received:", args.profile);
      if (args.existingUserId) {
        return args.existingUserId;
      }
      // Find user by email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingUser = await (ctx.db as any)
        .query("users")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_email", (q: any) => q.eq("email", args.profile.email))
        .unique();
      if (existingUser) return existingUser._id;
      // Extract invitedBy and set role
      const { fullName, invitedBy, ...rest } = args.profile;
      let role: "admin" | "member" = "admin";
      let invitedByValue: string | undefined = undefined;
      if (typeof invitedBy === "string") {
        role = "member";
        invitedByValue = invitedBy;
      }
      // Determine fullName
      let computedFullName: string | undefined = undefined;
      if (typeof fullName === "string" && fullName.length > 0) {
        computedFullName = fullName;
      } else if (typeof args.profile.email === "string") {
        // Fallback: use the part before @ in the email
        const emailName = args.profile.email.split("@")[0];
        computedFullName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
      return ctx.db.insert("users", {
        ...rest,
        fullName: computedFullName,
        invitedBy: invitedByValue,
        role,
      });
    },
  },
});