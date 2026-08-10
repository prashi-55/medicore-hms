import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Send, Trash2, AlertTriangle, MessageSquarePlus } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { aiService } from "../../services/domainServices";
import { MiniMarkdown } from "../../components/ai/MiniMarkdown";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { AIMessage } from "../../types";

const DISCLAIMER =
  "This AI assistant is for informational purposes only and is not a substitute for professional medical advice.";

export function AIAssistantPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<AIMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery({ queryKey: ["ai", "conversations"], queryFn: aiService.listConversations });
  const suggested = useQuery({ queryKey: ["ai", "suggested"], queryFn: aiService.suggestedQuestions });

  const activeConversation = useQuery({
    queryKey: ["ai", "conversation", activeConversationId],
    queryFn: () => aiService.getConversation(activeConversationId as string),
    enabled: !!activeConversationId,
  });

  useEffect(() => {
    if (activeConversation.data) {
      setLocalMessages(activeConversation.data.messages);
    } else if (!activeConversationId) {
      setLocalMessages([]);
    }
  }, [activeConversation.data, activeConversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [localMessages, isSending]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => aiService.chat(message, activeConversationId ?? undefined),
    onMutate: async (message: string) => {
      setIsSending(true);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          role: "user",
          content: message,
          is_emergency_flagged: false,
          created_at: new Date().toISOString(),
        },
      ]);
    },
    onSuccess: (res) => {
      setActiveConversationId(res.conversation_id);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          is_emergency_flagged: res.is_emergency,
          created_at: new Date().toISOString(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
    onSettled: () => setIsSending(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
      setActiveConversationId(null);
      setLocalMessages([]);
    },
  });

  const handleSend = (text?: string) => {
    const message = (text ?? draft).trim();
    if (!message || isSending) return;
    setDraft("");
    sendMutation.mutate(message);
  };

  const startNew = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
  };

  return (
    <div>
      <PageHeader
        title="AI Health Assistant"
        description="Educational guidance for common, non-emergency symptoms."
        action={
          <button className="btn-outline" onClick={startNew}>
            <MessageSquarePlus size={16} /> New conversation
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Conversation history sidebar */}
        <div className="card hidden max-h-[70vh] overflow-y-auto p-3 lg:block">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-ink/50">History</p>
          {conversations.data && conversations.data.length > 0 ? (
            <ul className="space-y-1">
              {conversations.data.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveConversationId(c.id)}
                    className={`group flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm ${
                      activeConversationId === c.id ? "bg-primary-50 text-primary-700" : "hover:bg-surface text-ink/70"
                    }`}
                  >
                    <span className="truncate">{c.title}</span>
                    <Trash2
                      size={13}
                      className="ml-2 hidden shrink-0 text-ink/30 hover:text-danger group-hover:block"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(c.id);
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 text-sm text-ink/40">No conversations yet.</p>
          )}
        </div>

        {/* Chat window */}
        <div className="card flex h-[70vh] flex-col lg:col-span-3">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {localMessages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Sparkles size={22} />
                </div>
                <p className="mt-3 font-medium text-ink">How can I help today?</p>
                <p className="mt-1 max-w-sm text-sm text-ink/60">
                  Ask about symptoms, general health questions, or self-care tips.
                </p>
                {suggested.data && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {suggested.data.map((q) => (
                      <button key={q} className="btn-outline text-xs" onClick={() => handleSend(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {localMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary-600 text-white rounded-br-sm"
                      : msg.is_emergency_flagged
                        ? "bg-danger/5 border border-danger/30 text-ink rounded-bl-sm"
                        : "bg-surface text-ink rounded-bl-sm"
                  }`}
                >
                  {msg.is_emergency_flagged && msg.role === "assistant" && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
                      <AlertTriangle size={13} /> Possible emergency
                    </div>
                  )}
                  {msg.role === "assistant" ? (
                    <MiniMarkdown content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-line p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                className="input flex-1"
                placeholder="Describe how you're feeling…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={isSending || !draft.trim()}>
                <Send size={16} />
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-ink/40">{DISCLAIMER}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
