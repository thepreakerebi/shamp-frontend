"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function JoinWorkspacePage() {
  const router = useRouter();
  const [inviteToken, setInviteToken] = useState<string | null | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | undefined>();
  const [workspaceName, setWorkspaceName] = useState<string | undefined>();

  const { seamlessJoinWorkspace, loading: authLoading } = useAuth();

  // Parse invite token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setInviteToken(t);
  }, []);

  const handleSeamlessJoin = async () => {
    if (!inviteToken) return;
    
    setJoining(true);
    setError(null);
    
    try {
      const data = (await seamlessJoinWorkspace(inviteToken)) as unknown as { workspaceName?: string; inviterName?: string };
      if (data) {
        setInviterName(data.inviterName);
        setWorkspaceName(data.workspaceName);
      }
      setJoined(true);
      
      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push("/home?joined=1");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join workspace");
    } finally {
      setJoining(false);
    }
  };

  if (inviteToken === undefined) {
    return null;
  }

  if (inviteToken === null) {
    return (
      <main className="w-full flex items-center justify-center p-4">
        <p className="text-destructive">Invalid or expired invite link.</p>
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
                  {workspaceName ? ` "${workspaceName}"` : " their workspace"}.
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
            
            <Button 
              type="button" 
              className="w-full" 
              onClick={handleSeamlessJoin} 
              disabled={joining || authLoading}
            >
              {joining ? (
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
            <p>Successfully joined! Redirecting to your workspace...</p>
          </>
        )}
      </section>
    </main>
  );
} 