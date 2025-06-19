"use client";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTestRuns } from "@/hooks/use-testruns";
import type { ChatMessage, TestRunStatus } from "@/hooks/use-testruns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  run: TestRunStatus;
  personaName?: string;
}

export function ChatPanel({ run, personaName }: Props) {
  const { getChatHistory, chatWithAgent } = useTestRuns();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch history on mount
  useEffect(() => {
    (async () => {
      try {
        const history = await getChatHistory({ testId: run.test, testRunId: run._id });
        setMessages(history);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      message: input.trim(),
      role: "user",
      testRunId: run._id,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await chatWithAgent({ testRunId: run._id, message: userMsg.message });
      const agentMsg: ChatMessage = {
        message: res.answer,
        role: "agent",
        testRunId: run._id,
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch {
      // rollback?
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

  const PersonaAvatar = (
    <Avatar className="w-6 h-6">
      <AvatarFallback>{personaName?.[0]?.toUpperCase() || "P"}</AvatarFallback>
    </Avatar>
  );

  const UserAvatar = (
    <Avatar className="w-6 h-6">
      <AvatarFallback>You</AvatarFallback>
    </Avatar>
  );

  return (
    <aside className="flex flex-col h-full overflow-hidden border-l">
      {/* Header */}
      <header className="p-4 border-b">
        <h2 className="font-semibold text-lg">Chat with {personaName || "Persona"}</h2>
      </header>

      {/* Messages */}
      <section className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <section key={idx} className={m.role === "user" ? "flex items-start justify-end gap-2" : "flex items-start gap-2"}>
            {m.role === "agent" && PersonaAvatar}
            <p className="rounded-lg bg-muted px-3 py-2 text-sm max-w-[75%] whitespace-pre-line">
              {m.message}
            </p>
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
          <div className="flex-1 rounded-full px-4 py-2 flex items-center">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-sm"
            />
          </div>
          <Button size="icon" type="submit" disabled={sending || !input.trim()} aria-label="Send message">
            ➤
          </Button>
        </form>
      </footer>
    </aside>
  );
} 