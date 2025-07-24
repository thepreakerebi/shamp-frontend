"use client";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTestRuns } from "@/hooks/use-testruns";
import type { ChatMessage as BaseChatMessage, TestRunStatus } from "@/hooks/use-testruns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBilling } from "@/hooks/use-billing";
import CheckDialog from "@/components/autumn/check-dialog";

interface ChatMessage extends BaseChatMessage {
  id?: string;
  loading?: boolean;
}

interface Props {
  run: TestRunStatus;
  personaName?: string;
}

export function ChatPanel({ run, personaName }: Props) {
  const { user } = useAuth();
  const { getChatHistory, chatWithAgent, testRuns } = useTestRuns();
  const { summary, loading: billingLoading } = useBilling();
  const [showPaywall, setShowPaywall] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Determine live browserUseStatus so UI reacts to real-time changes
  const liveRun = (testRuns ?? []).find(r => r._id === run._id);
  const browserStatus = liveRun?.browserUseStatus ?? run.browserUseStatus;
  const planName = summary?.products && Array.isArray(summary.products) && summary.products.length > 0
    ? ((summary.products[0] as { name?: string; id?: string }).name || (summary.products[0] as { id?: string }).id || '').toLowerCase()
    : 'free';

  const isFreePlan = !billingLoading && planName.startsWith('free');

  const isRunDone = ["finished", "stopped"].includes(browserStatus ?? "");
  const canChat = isRunDone && !isFreePlan;

  // Free-plan users who try to click the input after a run is done should see the paywall
  const paywallClickable = isRunDone && isFreePlan;

  const getChatPreview = () => {
    const nextProduct = {
      id: 'hobby',
      name: 'Hobby Plan',
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;
    return {
      scenario: 'feature_flag',
      feature_id: 'chat',
      feature_name: 'Chat',
      product_id: 'hobby',
      products: [nextProduct],
    } as unknown as Record<string, unknown>; // loose typing
  };

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch history on mount
  useEffect(() => {
    (async () => {
      try {
        const history = await getChatHistory({ testId: run.test, testRunId: run._id });

        // Backend returns objects with a `text` field instead of `message`.
        // Define a helper type to represent that shape so we avoid the `any` type.
        type RawChatMessage = ChatMessage & { text?: string };

        // Normalize history to ensure each entry has a `message` field.
        const normalized = (history as RawChatMessage[]).map((msg) => ({
          ...msg,
          message: msg.message ?? msg.text ?? "",
        }));

        setMessages(normalized);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!canChat || !input.trim()) return;
    const userMsg: ChatMessage = {
      message: input.trim(),
      role: "user",
      testRunId: run._id,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Add loading placeholder for persona response
    const placeholderId = `${Date.now()}-${Math.random()}`;
    const loadingMsg: ChatMessage = {
      id: placeholderId,
      message: "", // empty, will render skeleton
      role: "agent",
      testRunId: run._id,
      loading: true,
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      const res = await chatWithAgent({ testRunId: run._id, message: userMsg.message });
      const agentMsg: ChatMessage = {
        message: res.answer,
        role: "agent",
        testRunId: run._id,
      };
      // Replace placeholder with actual message
      setMessages(prev => prev.map(m => (m.id === placeholderId ? agentMsg : m)));
    } catch {
      // If failed, remove placeholder
      setMessages(prev => prev.filter(m => m.id !== placeholderId));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // Avatar helpers
  const PersonaAvatar = (
    <Avatar className="size-6">
      {run.personaAvatarUrl ? (
        <AvatarImage src={run.personaAvatarUrl} alt={personaName || "Persona"} />
      ) : (
        <AvatarFallback>{personaName?.[0]?.toUpperCase() || "P"}</AvatarFallback>
      )}
    </Avatar>
  );

  function getInitials(firstName?: string, lastName?: string, email?: string) {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "?";
  }

  const UserAvatar = (
    <Avatar>
      {user?.profilePicture ? (
        <AvatarImage src={user.profilePicture} alt={user?.firstName || user?.email || "User"} />
      ) : (
        <AvatarFallback>
          {getInitials(user?.firstName, user?.lastName, user?.email)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <aside className="flex flex-col h-full overflow-hidden border-l">
      {/* Header */}
      <header className="p-4 border-b flex items-center gap-2">
        {PersonaAvatar}
        <h2 className="font-semibold text-lg truncate">Chat with {personaName || "Persona"}</h2>
      </header>

      {/* Messages */}
      <section className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <section key={idx} className={m.role === "user" ? "flex items-start justify-end gap-2" : "flex items-start gap-2"}>
            {m.role === "agent" && PersonaAvatar}
            <section
              className={cn(
                "text-sm whitespace-pre-line max-w-[75%]",
                m.role === "user" && "rounded-lg bg-muted px-3 py-2"
              )}
            >
              {m.loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                m.message
              )}
            </section>
            {m.role === "user" && UserAvatar}
          </section>
        ))}
        <div ref={bottomRef} />
      </section>

      {/* Input */}
      <footer className="border-t p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div
            className="flex-1 rounded-full px-4 py-2 flex items-center"
            onClick={() => {
              if (paywallClickable) setShowPaywall(true);
            }}
          >
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={!canChat}
              className="flex-1 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-sm disabled:opacity-50"
            />
          </div>
          <Button size="icon" type="submit" disabled={!canChat || sending || !input.trim()} aria-label="Send message">
            ➤
          </Button>
        </form>
      </footer>

      {showPaywall && (
        /* @ts-expect-error preview partial */
        <CheckDialog open={showPaywall} setOpen={setShowPaywall} preview={getChatPreview()} />
      )}
    </aside>
  );
} 