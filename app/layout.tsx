import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shamp – AI Usability Testing for Web Apps",
  description:
    "Shamp is an AI-powered platform for agentic usability testing of web applications and digital products. Simulate real user personas, automate UX tests, and gain actionable insights to improve your product experience.",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/Shamp-mark.svg",
        href: "/Shamp-mark.svg",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/Shamp-mark.svg",
        href: "/Shamp-mark.svg",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}