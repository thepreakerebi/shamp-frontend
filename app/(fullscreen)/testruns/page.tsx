import { redirect } from "next/navigation";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function Page() {
  redirect("/test-runs");
  return null;
} 