"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

interface JoinResponse {
  message: string;
  workspaceName?: string;
  inviterName?: string;
}

export default function JoinWorkspacePage() {
  const router = useRouter();
  const { joinWorkspace, loading: authLoading, token: authToken } = useAuth();

  const [inviteToken, setInviteToken] = useState<string | null | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | undefined>();
  const [workspaceName, setWorkspaceName] = useState<string | undefined>();
  const [inviterFetched, setInviterFetched] = useState(false);

  // Parse invite token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setInviteToken(t);
  }, []);

  // Automatically attempt join once conditions are met
  useEffect(() => {
    if (!inviteToken || authLoading || !authToken || joined || joining) return;
    handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken, authLoading, authToken]);

  // Fetch inviter name when authenticated & token present
  useEffect(() => {
    if (!inviteToken || !authToken || inviterFetched) return;
    try {
      const [, payload] = inviteToken.split(".");
      if (!payload) return;
      const pad = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(pad));
      const inviterId = decoded.inviterId;
      if (!inviterId) return;
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/users/${inviterId}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            const name = `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.email;
            setInviterName(name);
            setInviterFetched(true);
          }
        })
        .catch(() => {});
    } catch {}
  }, [inviteToken, authToken, inviterFetched]);

  const handleJoin = async () => {
    if (!inviteToken) return;
    setJoining(true);
    setError(null);
    try {
      const res = (await joinWorkspace(inviteToken)) as unknown as JoinResponse;
      setInviterName(res.inviterName);
      setWorkspaceName(res.workspaceName);
      setJoined(true);
      // Redirect after a brief delay so the new workspace context loads
      setTimeout(() => router.push("/home?joined=1"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join workspace");
    } finally {
      setJoining(false);
    }
  };

  if (inviteToken === undefined) {
    // Still reading token from URL
    return null;
  }

  if (inviteToken === null) {
    return (
      <main className="w-full flex items-center justify-center p-4">
        <p className="text-destructive">Invalid or expired invite link.</p>
      </main>
    );
  }

  if (!authToken && !authLoading) {
    // User not logged in
    return (
      <main className="w-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            You need to log in before joining the workspace. Please sign in and then open the link again.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="bg-background w-full flex items-center justify-center px-4">
      <section className="w-full max-w-md text-center space-y-6">
        {!joined ? (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-medium">Join workspace</h1>
              {inviterName && (
                <p className="text-sm">
                  {inviterName} invited you to join
                  {workspaceName ? ` “${workspaceName}”` : " their workspace"}.
                </p>
              )}
            </header>
            {error && (
              <Alert variant="destructive" className="mb-2 text-left">
                <AlertDescription className="flex items-center gap-1">
                  <AlertCircle className="size-4" /> {error}
                </AlertDescription>
              </Alert>
            )}
            <Button type="button" className="w-full" onClick={handleJoin} disabled={joining || authLoading}>
              {joining || authLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Joining…
                </>
              ) : (
                "Join workspace"
              )}
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin mx-auto h-8 w-8" />
            <p>Joining workspace…</p>
          </>
        )}
      </section>
    </main>
  );
} 