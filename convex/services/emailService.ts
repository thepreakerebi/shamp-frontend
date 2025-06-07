"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.optional(v.string()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailOptions = {
      from: EMAIL_FROM,
      to: [args.to],
      subject: args.subject,
      ...(args.html ? { html: args.html } : {}),
      ...(args.text ? { text: args.text } : {}),
    } as unknown as CreateEmailOptions;

    const { error } = await resend.emails.send(emailOptions);
    if (error) {
      console.error("Resend email error:", error);
      throw new Error("Failed to send email");
    }
    return null;
  },
}); 