"use client";

import { Fragment, useState, useCallback, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { type Message } from "@/lib/constants";
import { sanitizeText } from "@/lib/utils";
import { useAuth, hasRole, getAuthHeaders } from "@/components/providers/AuthProvider";

const BACKEND_URL = "/api/query";
const BACKEND_HEALTH = "/api/health";

export type ChatMode = "ask" | "draft" | "interact";

type Thread = {
  id: string;
  title: string;
  mode: ChatMode;
  messages: Message[];
};

export function ChatApp() {
  const { loggedIn, user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>("ask");
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ragCollectionId, setRagCollectionId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const plusRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Messages for the currently active thread (derived, never shared).
  const activeThreadData = threads.find((t) => t.id === activeThread) ?? null;
  const messages = activeThreadData?.messages ?? [];

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/chat/threads/${threadId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete thread");

      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThread === threadId) {
        setActiveThread(null);
        setMode("ask");
      }
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : "Failed to delete thread");
      setTimeout(() => setBackendError(null), 3000);
    }
  }, [activeThread]);

  // Load persisted chat history from the backend when the user is authenticated.
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    fetch("/api/chat/threads", {
      headers: getAuthHeaders(),
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.threads) return;
        const loaded: Thread[] = (data.threads as any[]).map((t) => ({
          id: String(t.id),
          title: t.title,
          mode: t.mode || "ask",
          messages: (t.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            text: m.text,
            citations: m.citations || [],
          })),
        }));
        setThreads(loaded);
        if (!activeThread && loaded.length > 0) {
          setActiveThread(loaded[0].id);
          setMode(loaded[0].mode);
        }
      })
      .catch(() => {
        /* network error — keep local state */
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!activeThread || !loggedIn) return;
    const current = threads.find((t) => t.id === activeThread);
    if (current && current.messages.length > 0) return;
    let cancelled = false;
    fetch(`/api/chat/threads/${activeThread}`, {
      headers: getAuthHeaders(),
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setThreads((prev) =>
          prev.map((t) =>
            t.id === String(data.id)
              ? {
                  ...t,
                  title: data.title || t.title,
                  mode: data.mode || t.mode,
                  messages: (data.messages || []).map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    text: m.text,
                    citations: m.citations || [],
                  })),
                }
              : t
          )
        );
      })
      .catch(() => {
        /* best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [activeThread, loggedIn]);

  useEffect(() => {
    if (sidebarOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (!profileOpen) {
      setProfileDetailsOpen(false);
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (!plusOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (plusRef.current && !plusRef.current.contains(event.target as Node)) {
        setPlusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [plusOpen]);

  const checkBackend = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(BACKEND_HEALTH, {
        method: "GET",
        signal: controller.signal,
        credentials: "include",
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const saveChatMessage = useCallback(async (threadId: string, role: string, text: string, citations?: string[]) => {
    try {
      await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ role, text, citations }),
      });
    } catch {
      /* best-effort persistence */
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^text\/|\.txt$|\.md$|\.pdf$/i.test(file.type + file.name)) {
      setUploadError("Please upload a .txt, .md, or .pdf file.");
      return;
    }
    setFileUploading(true);
    setUploadedFile(file);
    setRagCollectionId(null);
    setUploadError(null);

    const tryRagUpload = async (): Promise<boolean> => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);

        const res = await fetch("/api/rag/upload", {
          method: "POST",
          headers: {
            "X-Requested-With": "nyayantar",
          },
          credentials: "include",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Upload failed: ${res.status}`);
        }

        const data = await res.json();
        setRagCollectionId(data.collection_id || null);
        setDraft((d) => (d ? d + " " : "") + `[Document: ${file.name}]\nUploaded to knowledge base.`);
        return true;
      } catch (err: any) {
        console.error("RAG upload error:", err);
        return false;
      }
    };

    try {
      const ragOk = await tryRagUpload();
      if (!ragOk) {
        if (/\.pdf$/i.test(file.name)) {
          setUploadError("PDF requires the Bizfylabs RAG API key. Configure RAG_API_KEY in .env, or upload .txt/.md files.");
          setUploadedFile(null);
        } else {
          const text = await file.text();
          setDraft((d) => (d ? d + " " : "") + `[Document: ${file.name}]\n${text.slice(0, 8000)}`);
        }
      }
    } catch {
      setUploadError("Could not read the uploaded file.");
      setUploadedFile(null);
    } finally {
      setFileUploading(false);
    }
  };

  const startVoiceInput = async () => {
    setBackendError(null);
    setVoiceError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError("Microphone is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsListening(false);
        setTranscribing(true);
        try {
          const mimeType = mediaRecorder.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "webm";
          const formData = new FormData();
          formData.append("file", blob, `audio.${ext}`);
          formData.append("model", "base");

          const res = await fetch("/api/stt", {
            method: "POST",
            headers: {
              "X-Requested-With": "nyayantar",
            },
            credentials: "include",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`STT failed: ${res.status}`);
          }

          const data = await res.json();
          const transcript = data?.text?.trim();
          if (transcript) {
            setDraft((d) => (d ? d + " " + transcript : transcript));
            setVoiceError(null);
          } else {
            setVoiceError("No speech detected. Please try again.");
          }
        } catch (err: any) {
          console.error("STT error:", err);
          setVoiceError(err.message || "Speech transcription failed.");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Mic error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setVoiceError("Microphone permission denied. Click the mic/camera icon in the address bar and set it to 'Allow', then try again.");
      } else if (err.name === "NotFoundError") {
        setVoiceError("No microphone found. Please connect a microphone and try again.");
      } else {
        setVoiceError("Microphone access denied or unavailable. Check browser permissions.");
      }
    }
  };

  const stopVoiceInput = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setIsListening(false);
    }
  };

  const send = useCallback(async () => {
    const text = sanitizeText(draft);
    if (!text || loading) return;

    let threadId = activeThread;
    const newThreadTitle = text.slice(0, 40) + (text.length > 40 ? "…" : "");

    // Create a new thread in the backend if this is a fresh conversation.
    if (!threadId) {
      try {
        const res = await fetch("/api/chat/threads", {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ title: newThreadTitle, mode }),
        });
        if (!res.ok) throw new Error("Failed to create thread");
        const thread = await res.json();
        threadId = String(thread.id);
      } catch (err) {
        setBackendError(err instanceof Error ? err.message : "Failed to create chat thread");
        return;
      }
    }

    // Update local state: ensure thread exists and mark it active.
    setThreads((t) => {
      const exists = t.find((x) => x.id === threadId!);
      if (exists) {
        return t.map((x) =>
          x.id === threadId
            ? { ...x, title: newThreadTitle, mode, active: true }
            : { ...x, active: false }
        );
      }
      return [
        { id: threadId!, title: newThreadTitle, mode, messages: [] },
        ...t.map((x) => ({ ...x, active: false })),
      ];
    });

    setActiveThread(threadId!);
    const userMsg = { id: Date.now(), role: "user" as const, text };
    setThreads((t) =>
      t.map((x) =>
        x.id === threadId
          ? { ...x, messages: [...x.messages, userMsg] }
          : x
      )
    );
    setDraft("");
    setLoading(true);
    setBackendError(null);
    setVoiceError(null);

    // Persist user message (best-effort).
    saveChatMessage(threadId!, "user", text).catch(() => {});

    try {
      let finalResponse: string;
      let citations: string[] = [];

      if (ragCollectionId) {
        try {
          const res = await fetch("/api/rag/query", {
            method: "POST",
            headers: getAuthHeaders(),
            credentials: "include",
            body: JSON.stringify({
              query: text,
              collection_id: ragCollectionId,
              top_k: 5,
            }),
          });

          if (!res.ok) {
            throw new Error(`RAG query failed: ${res.status}`);
          }

          const data = await res.json();
          finalResponse = data.answer || "No answer found.";
          citations = (data.citations || []).map((c: any) => c.title || c.document_id || "").filter(Boolean);
        } catch (ragErr: any) {
          console.error("RAG query error, falling back to local:", ragErr);
          const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: getAuthHeaders(),
            credentials: "include",
            body: JSON.stringify({
              query: text,
              file_content: uploadedFile ? draft : undefined,
              file_name: uploadedFile ? uploadedFile.name : undefined,
            }),
          });

          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }

          const data = await res.json();

          if (!data || typeof data !== "object") {
            throw new Error("Received an invalid response from the server.");
          }

          if (data.phases) {
            for (const phase of data.phases) {
              if (phase.output?.document_retrieval?.sources) {
                for (const src of phase.output.document_retrieval.sources) {
                  if (src.citation) {
                    citations.push(src.citation);
                  }
                }
              }
              if (phase.output?.web_search) {
                if (phase.output.web_search.web_sources) {
                  for (const src of phase.output.web_search.web_sources) {
                    const title = src.title || src.url;
                    if (title) citations.push(title);
                  }
                }
                if (phase.output.web_search.news_sources) {
                  for (const src of phase.output.web_search.news_sources) {
                    const title = src.title || src.url;
                    if (title) citations.push(title);
                  }
                }
              }
            }
          }

          finalResponse = data.final_response;
          if (!finalResponse || finalResponse.trim() === "") {
            throw new Error("The server returned an empty response.");
          }
        }
      } else {
        const res = await fetch(BACKEND_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            query: text,
            file_content: uploadedFile ? draft : undefined,
            file_name: uploadedFile ? uploadedFile.name : undefined,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();

        if (!data || typeof data !== "object") {
          throw new Error("Received an invalid response from the server.");
        }

        if (data.phases) {
          for (const phase of data.phases) {
            if (phase.output?.document_retrieval?.sources) {
              for (const src of phase.output.document_retrieval.sources) {
                if (src.citation) {
                  citations.push(src.citation);
                }
              }
            }
            if (phase.output?.web_search) {
              if (phase.output.web_search.web_sources) {
                for (const src of phase.output.web_search.web_sources) {
                  const title = src.title || src.url;
                  if (title) citations.push(title);
                }
              }
              if (phase.output.web_search.news_sources) {
                for (const src of phase.output.web_search.news_sources) {
                  const title = src.title || src.url;
                  if (title) citations.push(title);
                }
              }
            }
          }
        }

        finalResponse = data.final_response;
        if (!finalResponse || finalResponse.trim() === "") {
          throw new Error("The server returned an empty response.");
        }
      }

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant" as const,
        text: finalResponse,
        citations: citations.length > 0 ? citations : undefined,
      };
      setThreads((t) =>
        t.map((x) =>
          x.id === threadId
            ? { ...x, messages: [...x.messages, assistantMsg] }
            : x
        )
      );
      saveChatMessage(threadId!, "assistant", finalResponse, citations.length > 0 ? citations : undefined).catch(() => {});
    } catch (err: any) {
      console.error("Error communicating with backend:", err);
      setBackendError(err.message || "Unknown error");
      const errorMsg = {
        id: Date.now() + 1,
        role: "assistant" as const,
        text: `Error: ${err.message || "Unable to connect to the backend server."} Please make sure the backend is running at /api.`,
      };
      setThreads((t) =>
        t.map((x) =>
          x.id === threadId
            ? { ...x, messages: [...x.messages, errorMsg] }
            : x
        )
      );
      saveChatMessage(threadId!, "assistant", errorMsg.text).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, [draft, loading, activeThread, mode, uploadedFile, ragCollectionId, saveChatMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  const isBackendOffline = backendError !== null;

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const shouldScroll =
      messages.length > 1 ||
      (messages.length === 1 && messages[0].role === "user") ||
      loading;
    if (shouldScroll) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex h-[100dvh] min-h-0 w-full bg-page">
      {/* Sidebar (desktop + drawer on mobile) */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-surface-tint/40 transition-transform duration-300 lg:relative lg:translate-x-0`}
        aria-label="Chat sidebar"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="flex items-center gap-2">
              <Logo />
              <span className="text-base font-semibold tracking-tight-2">
                Nyayantar
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text lg:hidden"
              aria-label="Close sidebar"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={() => {
                setActiveThread(null);
                setMode("ask");
                setDraft("");
                setSidebarOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text framer-transition hover:border-text/30"
            >
              <Icon name="spark" size={16} className="text-accent1" />
              New research
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label="Workspace sections">
            {([
              { key: "ask", label: "Ask", icon: "spark" },
              { key: "draft", label: "Draft", icon: "doc" },
              { key: "interact", label: "Interact", icon: "layers" },
            ] as const).map((s) => {
              const isActive = mode === s.key && !activeThread;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setMode(s.key);
                    setActiveThread(null);
                    setSidebarOpen(false);
                  }}
                  aria-pressed={isActive}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm framer-transition ${
                    isActive
                      ? "bg-surface text-text shadow-[0_4px_14px_rgba(141,75,44,0.08)]"
                      : "text-text-muted hover:bg-surface hover:text-text"
                  }`}
                >
                  <Icon name={s.icon as any} size={15} className={isActive ? "text-accent1" : ""} />
                  {s.label}
                  {isActive && (
                    <span className="ml-auto rounded-full bg-accent1/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent1">
                      Active
                    </span>
                  )}
                </button>
              );
            })}

            <div className="my-3 h-px bg-border" />

            <p className="px-3 pb-2 text-xs font-medium text-text-muted">Recent</p>
            {threads.length === 0 ? (
              <p className="px-3 py-2 text-sm text-text-muted">No threads yet</p>
            ) : (
              threads.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveThread(t.id);
                      setMode(t.mode);
                      setSidebarOpen(false);
                    }}
                    aria-current={t.id === activeThread ? "true" : undefined}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm framer-transition ${
                      t.id === activeThread
                        ? "bg-surface text-text shadow-[0_4px_14px_rgba(141,75,44,0.08)]"
                        : "text-text-muted hover:bg-surface hover:text-text"
                    }`}
                  >
                    <Icon
                      name={t.mode === "draft" ? "doc" : t.mode === "interact" ? "layers" : "search"}
                      size={15}
                      className={t.id === activeThread ? "text-accent1" : ""}
                    />
                    <span className="truncate">{t.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(t.id);
                    }}
                    aria-label={`Delete ${t.title}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:border-fire-brick/40 hover:text-fire-brick"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))
            )}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-surface-tint/40 p-3">
            {hasRole(user, ["admin", "sudo_admin", "super_admin"]) && (
              <a
                href="/admin"
                className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm font-medium text-text-muted framer-transition hover:text-text"
              >
                <Icon name="shield" size={16} />
                Admin panel
              </a>
            )}
            <div className="relative mt-2" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm font-medium text-text framer-transition hover:border-text/30"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
                  {user?.initials ?? "U"}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-xs font-semibold text-text">
                    {user?.name ?? "User"}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">
                    {user?.email ?? ""}
                  </p>
                </div>
                <Icon
                  name="arrow"
                  size={14}
                  className={`ml-auto text-text-muted framer-transition ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
                  <div className="p-1.5 space-y-0.5">
                    <a
                      href="/settings"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                    >
                      <Icon name="settings" size={16} />
                      Settings
                    </a>
                    <button
                      type="button"
                      onClick={() => setProfileDetailsOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                    >
                      <span className="truncate">{user?.name ?? "Profile"}</span>
                      <Icon
                        name="arrow"
                        size={14}
                        className={`text-text-muted framer-transition ${
                          profileDetailsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {profileDetailsOpen && (
                      <div className="px-3 py-2 space-y-1 border-t border-border mt-1">
                        <p className="text-xs text-text-muted">{user?.email ?? ""}</p>
                        <p className="text-xs text-text-muted capitalize">
                          {user?.role?.replace("_", " ") ?? "User"}
                        </p>
                      </div>
                    )}
                    <a
                      href="/help"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                    >
                      <Icon name="help" size={16} />
                      Help
                    </a>
                    <a
                      href="/personalize"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                    >
                      <Icon name="spark" size={16} />
                      Personalize
                    </a>
                    <a
                      href="/pricing"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                    >
                      <Icon name="star" size={16} />
                      Upgrade plan
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      {/* Main chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text lg:hidden"
              aria-label="Open sidebar"
            >
              <Icon name="menu" size={18} />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-tint text-accent1">
              <Icon name="brain" size={18} />
            </span>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text">
                    {uploadedFile ? `Analyzing: ${uploadedFile.name}` : "Nyayantar Assistant"}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      mode === "ask"
                        ? "bg-accent1/10 text-accent1"
                        : mode === "draft"
                        ? "bg-accent2/10 text-accent2"
                        : "bg-surface-tint text-text-muted"
                    }`}
                  >
                    <Icon
                      name={mode === "ask" ? "spark" : mode === "draft" ? "doc" : "layers"}
                      size={11}
                    />
                    {mode}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  {isBackendOffline ? (
                    <span className="inline-flex items-center gap-1.5 text-fire-brick">
                      <span className="h-1.5 w-1.5 rounded-full bg-fire-brick animate-pulse" />
                      Backend offline
                    </span>
                  ) : voiceError ? (
                    <span className="inline-flex items-center gap-1.5 text-fire-brick">
                      <span className="h-1.5 w-1.5 rounded-full bg-fire-brick animate-pulse" />
                      {voiceError}
                    </span>
                  ) : ragCollectionId ? (
                    "Knowledge base ready — ask questions about it"
                  ) : uploadedFile ? (
                    "Document ready — ask questions about it"
                  ) : transcribing ? (
                    "Transcribing…"
                  ) : isListening ? (
                    "Listening…"
                  ) : (
                    "Cite-checked · online"
                  )}
                </p>
              </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-2.5 py-1 text-xs text-text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${isBackendOffline ? "bg-fire-brick" : "bg-accent2"}`} />
            SOC 2
          </span>
        </header>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
        >
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-tint text-accent1">
                <Icon name="brain" size={22} />
              </span>
              <p className="type-body text-text-muted">Start a conversation to begin research.</p>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-surface-tint px-4 py-2.5 text-sm leading-6 text-text md:max-w-[70%]">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
                  N
                </span>
                <div className="max-w-[85%] md:max-w-[70%]">
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-2.5 text-sm text-text">
                    <MarkdownRenderer content={m.text} />
                  </div>
                  {m.citations && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.citations.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1.5 rounded-full border border-accent-border-gradient/40 bg-surface-tint px-2.5 py-1 text-xs font-medium text-accent1"
                        >
                          <Icon name="doc" size={12} />
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white animate-pulse">
                N
              </span>
              <div className="max-w-[85%] md:max-w-[70%]">
                <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm text-text-muted flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {isBackendOffline && !loading && messages.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={async () => {
                  const online = await checkBackend();
                  if (online) {
                    setBackendError(null);
                    setVoiceError(null);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-fire-brick/30 bg-fire-brick/5 px-4 py-2.5 text-sm font-medium text-fire-brick framer-transition hover:bg-fire-brick/10"
              >
                <Icon name="spark" size={16} />
                Retry connection
              </button>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-surface/80 p-3 backdrop-blur-md md:p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
            <input
              type="file"
              id="file-upload"
              accept=".txt,.md,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* + button with popover (attach file / connectors) */}
            <div className="relative" ref={plusRef}>
              <button
                type="button"
                onClick={() => setPlusOpen((v) => !v)}
                aria-label="More options"
                aria-expanded={plusOpen}
                disabled={isBackendOffline || loading || fileUploading || isListening || transcribing}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text ${
                  isBackendOffline || loading || fileUploading || isListening || transcribing
                    ? "cursor-not-allowed opacity-40"
                    : plusOpen
                    ? "border-accent1 text-accent1"
                    : "hover:border-text/30"
                }`}
              >
                <Icon name="plus" size={18} />
              </button>

              {plusOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
                  <button
                    type="button"
                    onClick={() => {
                      setPlusOpen(false);
                      document.getElementById("file-upload")?.click();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text framer-transition hover:bg-surface-tint"
                  >
                    <Icon name="doc" size={16} className="text-accent1" />
                    <span>
                      <span className="block font-medium">Attach file</span>
                      <span className="block text-xs text-text-muted">Upload a document to analyze</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlusOpen(false);
                      setDemoNotice("Connectors are in demo mode — integration coming soon.");
                      setTimeout(() => setDemoNotice(null), 4000);
                    }}
                    className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm text-text framer-transition hover:bg-surface-tint"
                  >
                    <Icon name="layers" size={16} className="text-accent1" />
                    <span>
                      <span className="block font-medium">Connectors (Demo)</span>
                      <span className="block text-xs text-text-muted">Connect Drive, Slack, Gmail…</span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setVoiceError(null); setUploadError(null); }}
              onKeyDown={handleKeyDown}
              placeholder={
                isBackendOffline
                  ? "Backend is offline — messages cannot be sent"
                  : transcribing
                  ? "Transcribing…"
                  : isListening
                  ? "Listening… speak now"
                  : ragCollectionId
                  ? "Ask questions about the uploaded document"
                  : uploadedFile
                  ? `Ask questions about ${uploadedFile.name}`
                  : "Ask about a case, clause, or citation…"
              }
              aria-label="Chat message input"
              disabled={isBackendOffline || fileUploading || isListening || transcribing}
              className={`min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm text-text outline-none placeholder:text-text-muted/60 ${
                isBackendOffline || fileUploading || isListening || transcribing ? "cursor-not-allowed opacity-60" : ""
              }`}
            />

            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              disabled={isBackendOffline || loading || fileUploading || transcribing}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text ${
                isBackendOffline || loading || fileUploading || transcribing
                  ? "cursor-not-allowed opacity-40"
                  : isListening
                  ? "border-accent1 text-accent1"
                  : "hover:border-text/30"
              }`}
            >
              <Icon name="mic" size={16} className={isListening || transcribing ? "animate-pulse" : ""} />
            </button>

            <button
              type="button"
              onClick={send}
              aria-label="Send message"
              disabled={isBackendOffline || fileUploading || isListening || transcribing || !draft.trim()}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg primary-gradient text-white ${
                isBackendOffline || fileUploading || isListening || transcribing || !draft.trim() ? "cursor-not-allowed opacity-40" : ""
              }`}
            >
              <Icon name="arrow" size={16} />
            </button>
          </div>

          {demoNotice && (
            <div className="mx-auto mt-2 max-w-3xl rounded-xl border border-accent1/20 bg-accent1/8 px-4 py-2 text-center text-xs text-text">
              {demoNotice}
            </div>
          )}

          {uploadError && (
            <div className="mx-auto mt-2 max-w-3xl flex items-center justify-between gap-3 rounded-xl border border-fire-brick/30 bg-fire-brick/5 px-4 py-2 text-xs text-fire-brick">
              <span className="truncate">{uploadError}</span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="shrink-0 rounded-md border border-fire-brick/30 px-1.5 py-0.5 text-[10px] hover:bg-fire-brick/10"
                aria-label="Dismiss upload error"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
