"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "Explain this repository",
  "Explain this file",
  "Find authentication logic",
  "Find dead code",
  "Explain architecture",
  "Suggest improvements",
  "Find performance bottlenecks",
  "Explain database schema",
  "Generate documentation",
];

interface ChatHistoryItem {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function ChatSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-[#414754] p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "" : "flex-row-reverse")}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className={cn("h-20 rounded-2xl", i % 2 === 0 ? "w-2/3" : "w-1/2")} />
            </div>
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-xl mt-4" />
      </div>
    </div>
  );
}

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    async function loadChats() {
      try {
        const res = await fetch("/api/ai/chats");
        if (res.ok) {
          const data = await res.json();
          setChatHistory(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadChats();
  }, []);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          repositoryId: null,
          chatId: activeChatId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: `Error: ${err.error || "Failed to get response"}` }
              : m
          )
        );
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: "Connection error. Please try again." }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [streaming, activeChatId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    handleSend(question);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setInput("");
    inputRef.current?.focus();
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/chats/${id}`, { method: "DELETE" });
      if (res.ok) {
        setChatHistory((prev) => prev.filter((c) => c.id !== id));
        if (activeChatId === id) {
          handleNewChat();
        }
      }
    } catch {
      // ignore
    }
  };

  const loadChat = async (id: string) => {
    setLoading(true);
    setActiveChatId(id);
    try {
      const res = await fetch(`/api/ai/chats/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <ChatSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] -m-6 md:-m-8">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-r border-[#414754] bg-[#1c1f27] overflow-hidden"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-[#414754]">
                  <Button
                    onClick={handleNewChat}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Chat
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-1">
                    {chatHistory.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-8">
                        No chat history yet
                      </p>
                    ) : (
                      chatHistory.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => loadChat(chat.id)}
                          className={cn(
                            "w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors group",
                            activeChatId === chat.id
                              ? "bg-[#0070f3]/10 text-[#0070f3]"
                              : "text-zinc-300 hover:bg-[#272a32]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <span className="truncate flex-1">{chat.title}</span>
                            <button
                              onClick={(e) => handleDeleteChat(e, chat.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5 pl-6">
                            {chat.messageCount} messages
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-lg border border-[#414754] border-l-0 bg-[#1c1f27] p-1.5 text-zinc-400 hover:text-white transition-colors"
          style={{ marginLeft: sidebarOpen ? 288 : 0 }}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1 flex flex-col min-w-0 bg-[#10131b]">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-6 rounded-2xl bg-[#0070f3]/10 p-4">
                  <Bot className="h-10 w-10 text-[#0070f3]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  AI Repository Chat
                </h2>
                <p className="text-zinc-400 max-w-md mb-8">
                  Ask questions about your codebase, get architecture insights,
                  and understand your repositories better.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedQuestion(q)}
                      className={cn(
                        "rounded-full border border-[#414754] bg-[#1c1f27] px-3.5 py-1.5",
                        "text-sm text-zinc-300 hover:bg-[#272a32] hover:text-white",
                        "transition-colors"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        msg.role === "user"
                          ? "bg-[#0070f3]"
                          : "bg-[#6807ba]"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[80%]",
                        msg.role === "user"
                          ? "bg-[#0070f3] text-white rounded-tr-sm"
                          : "bg-[#1c1f27] text-zinc-200 rounded-tl-sm border border-[#414754]"
                      )}
                    >
                      {msg.role === "assistant" && msg.content === "" && streaming ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="px-4 md:px-8 py-3 border-t border-[#414754]">
              <div className="flex flex-wrap gap-2 max-w-3xl mx-auto mb-3">
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedQuestion(q)}
                    disabled={streaming}
                    className="rounded-full border border-[#414754] bg-[#1c1f27]/50 px-3 py-1 text-xs text-zinc-400 hover:bg-[#272a32] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
                <button
                  onClick={handleNewChat}
                  className="rounded-full border border-[#414754] bg-[#1c1f27]/50 px-3 py-1 text-xs text-zinc-400 hover:bg-[#272a32] hover:text-white transition-colors"
                >
                  <Plus className="h-3 w-3 inline mr-0.5" />
                  New
                </button>
              </div>
            </div>
          )}

          <div className="px-4 md:px-8 py-4 border-t border-[#414754] bg-[#1c1f27]/50">
            <div className="max-w-3xl mx-auto flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your codebase..."
                disabled={streaming}
                className="flex-1 h-12 bg-[#10131b] border-[#414754] text-zinc-100 placeholder:text-zinc-500"
              />
              <Button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || streaming}
                size="icon"
                className="h-12 w-12 shrink-0"
              >
                {streaming ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
