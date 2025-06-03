import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shamp – AI Usability Testing for Web Apps",
  description:
    "Shamp is an AI-powered platform for agentic usability testing of web applications and digital products. Simulate real user personas, automate UX tests, and gain actionable insights to improve your product experience.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-6">
      <div className="mb-8">
        <Image
          src="/Shamp-mark.svg"
          alt="Shamp Logo"
          width={120}
          height={40}
          className="dark:hidden"
        />
        <Image
          src="/Shamp-mark.svg"
          alt="Shamp Logo"
          width={120}
          height={40}
          className="hidden dark:block"
        />
      </div>
      {children}
    </div>
  );
}
