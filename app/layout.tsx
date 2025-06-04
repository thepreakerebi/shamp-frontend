import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
