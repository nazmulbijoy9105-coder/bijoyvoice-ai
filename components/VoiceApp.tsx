"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, RotateCcw, Send, Shield, Square } from "lucide-react";

type Role = "user" | "assistant";

interface Msg {
  role: Role;
  content: string;
}

const LABELS = {
  idle: "বলুন বা টাইপ করুন…",
  listening: "শুনছি…",
  thinking: "ভাবছি…",
  speaking: "বলছি…",
} as const;

const BANGLA = {
  noSpeech: "এই ব্রাউজারে বাংলা স্পিচ রিকগনিশন নেই। নিচে টাইপ করে পাঠান।",
  micDenied: "মাইক্রোফোনের অনুমতি দরকার।",
  networkError: "নেটওয়ার্ক বা সার্ভার সমস্যা। আবার চেষ্টা করুন।",
};

/** Siri-style positioning: voice-first, useful, privacy-minded — in Bangla */
const VOICE_ASSISTANT_COPY = {
  headline: "বাংলায় বলুন — কাজ সারুন",
  sub: "প্রশ্ন, পরামর্শ, লেখা বা আড্ডা—সবই শুধু কণ্ঠস্বরে বা টাইপে। খুব সহজ—সম্পূর্ণ বাংলায়।",
  privacy:
    "আপনার কথা প্রকাশ্যে শেয়ার করা হয় না। স্মার্ট সহকারী—গোপনীয়তা মাথায় রেখে।",
  emptyHint: "মাইক টিপে বলুন, অথবা নিচে বাংলায় লিখে পাঠান।",
} as const;

export default function VoiceApp() {
  const [status, setStatus] = useState<keyof typeof LABELS>("idle");
  const [history, setHistory] = useState<Msg[]>([]);
  const [textInput, setTextInput] = useState("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const processingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth || !text.trim()) {
      setStatus("idle");
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "bn-BD";
    utter.rate = 1;
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus("idle");
    utter.onerror = () => setStatus("idle");
    synth.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setStatus("idle");
  }, []);

  const sendMessages = useCallback(
    async (nextHistory: Msg[]) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setErrorBanner(null);
      setStatus("thinking");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextHistory }),
          cache: "no-store",
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        const reply = data.reply || "দুঃখিত, আমি বুঝতে পারিনি।";
        if (!res.ok) {
          setErrorBanner(data.error || BANGLA.networkError);
          setHistory((h) => [...h, { role: "assistant", content: reply }]);
          setStatus("idle");
          return;
        }
        setHistory((h) => [...h, { role: "assistant", content: reply }]);
        speak(reply);
      } catch {
        setErrorBanner(BANGLA.networkError);
        setStatus("idle");
      } finally {
        processingRef.current = false;
      }
    },
    [speak]
  );

  const handleUserTurnRef = useRef<(text: string) => void>(() => {});

  const handleUserTurn = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setHistory((prev) => {
        const next = [...prev, { role: "user" as const, content: trimmed }];
        void sendMessages(next);
        return next;
      });
    },
    [sendMessages]
  );

  handleUserTurnRef.current = handleUserTurn;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "bn-BD";

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) handleUserTurnRef.current(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") setErrorBanner(BANGLA.micDenied);
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recognition.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleMic = useCallback(() => {
    setErrorBanner(null);
    const r = recognitionRef.current;
    if (!r) {
      setErrorBanner(BANGLA.noSpeech);
      return;
    }
    if (status === "listening") {
      try {
        r.stop();
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      r.abort();
    } catch {
      /* ignore */
    }
    try {
      setStatus("listening");
      r.start();
    } catch {
      setStatus("idle");
      setErrorBanner("মাইক চালু করা যায়নি। আবার চেষ্টা করুন।");
    }
  }, [status]);

  const clearChat = useCallback(() => {
    stopSpeaking();
    setHistory([]);
    setErrorBanner(null);
    setTextInput("");
  }, [stopSpeaking]);

  const submitTyped = useCallback(() => {
    const t = textInput.trim();
    if (!t) return;
    setTextInput("");
    handleUserTurn(t);
  }, [textInput, handleUserTurn]);

  const busy = status === "thinking";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-[#04091a] px-3 py-4 text-white sm:px-4">
      <div className="flex w-full max-w-lg flex-1 flex-col gap-3 sm:max-w-md">
        <header className="shrink-0 space-y-2 text-center">
          <h1 className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            BijoyVoice AI
          </h1>
          <p className="text-sm font-medium leading-snug text-zinc-200 sm:text-base">{VOICE_ASSISTANT_COPY.headline}</p>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-zinc-500 sm:text-sm">{VOICE_ASSISTANT_COPY.sub}</p>
          <p className="mx-auto flex max-w-md items-start justify-center gap-2 text-left text-[11px] leading-relaxed text-emerald-200/80 sm:text-xs">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            <span>{VOICE_ASSISTANT_COPY.privacy}</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">NB TECH</p>
        </header>

        {!speechSupported && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100/90 sm:text-sm">
            {BANGLA.noSpeech}
          </p>
        )}

        {errorBanner && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-100/90 sm:text-sm">
            {errorBanner}
          </p>
        )}

        <div
          ref={scrollRef}
          className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/40 p-3 backdrop-blur-xl sm:p-4"
        >
          {history.length === 0 && (
            <p className="px-2 py-8 text-center text-sm leading-relaxed text-zinc-500">{VOICE_ASSISTANT_COPY.emptyHint}</p>
          )}
          {history.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[85%] sm:text-[15px] ${
                  m.role === "user"
                    ? "bg-violet-600/90 text-white"
                    : "border border-white/10 bg-black/30 text-zinc-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" aria-hidden />
                {LABELS.thinking}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-3 backdrop-blur-xl sm:p-4">
          <div className="relative flex justify-center">
            <div
              className={`pointer-events-none absolute inset-0 rounded-full bg-violet-500/25 blur-3xl transition-opacity duration-500 ${
                status !== "idle" ? "opacity-100" : "opacity-0"
              }`}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMic}
                disabled={busy || !speechSupported || status === "speaking"}
                aria-label={status === "listening" ? "শোনা বন্ধ করুন" : "মাইক্রোফোন চালু করুন"}
                className="relative rounded-full bg-violet-600 p-6 text-white shadow-lg transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 sm:p-7"
              >
                {status === "listening" ? <MicOff className="h-9 w-9 sm:h-10 sm:w-10" /> : <Mic className="h-9 w-9 sm:h-10 sm:w-10" />}
              </button>
              {status === "speaking" && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  aria-label="কথা বন্ধ করুন"
                  className="rounded-full border border-white/20 bg-red-600/90 p-4 text-white hover:bg-red-500"
                >
                  <Square className="h-6 w-6 fill-current" />
                </button>
              )}
            </div>
          </div>

          <div className="flex h-8 items-center justify-center gap-2 text-sm font-medium text-violet-200/80">
            {(status === "listening" || status === "speaking") && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" aria-hidden />
            )}
            <span>{LABELS[status]}</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submitTyped())}
              placeholder="বাংলায় টাইপ করুন…"
              disabled={busy}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-violet-500/40 placeholder:text-zinc-600 focus:ring-2"
              autoComplete="off"
              enterKeyHint="send"
            />
            <button
              type="button"
              onClick={submitTyped}
              disabled={busy || !textInput.trim()}
              aria-label="পাঠান"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cyan-600 px-3 py-2 text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={clearChat}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs text-zinc-400 transition hover:border-white/20 hover:text-zinc-200 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            নতুন কথোপকথন
          </button>
        </div>
      </div>
    </div>
  );
}
