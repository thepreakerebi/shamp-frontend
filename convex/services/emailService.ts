import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { alphabet, generateRandomString } from "oslo/crypto";

// Email verification provider (Resend example)
export const ResendEmailVerificationOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Shamp <onboarding@resend.dev>",
      to: [email],
      subject: `Sign in to Shamp`,
      text: "Your email verification code is " + token,
    });
    if (error) throw new Error("Could not send");
  },
});

export const ResendPasswordResetOTP = Resend({
  id: "resend-otp-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Shamp <onboarding@resend.dev>",
      to: [email],
      subject: `Reset your password in Shamp`,
      text: "Your password reset code is " + token,
    });
    if (error) {
      throw new Error("Could not send");
    }
  },
});