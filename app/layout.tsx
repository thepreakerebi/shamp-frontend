import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { AutumnProvider } from "autumn-js/next";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the current workspace identifier that we store in a cookie (set from the AuthProvider on the client).
  // This runs on the server, so we can safely access the cookie here.
  const cookieStore = await cookies();
  const wsCookie = cookieStore.get("ws")?.value;
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* AutumnProvider must be rendered in a server component (which this layout is). */}
        <AutumnProvider customerId={wsCookie}>{children}</AutumnProvider>
      </body>
    </html>
  );
}