import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  // Add any other config as needed
}); 