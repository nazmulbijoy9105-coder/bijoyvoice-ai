"use client";
import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";

type Role = "user" | "assistant";
interface Msg { role: Role; content: string; }

const LABELS = {
  idle: "বলুন...",
  listening: "শুনছি...",
  thinking: "ভাবছি...",
  speaking: "বলছি...",
};

export default function VoiceApp() {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [history, setHistory] = useState<Msg[]>([]);
  const [liveText, setLiveText] = useState("");
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (Speech) {
        recognitionRef.current = new Speech();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = "bn-BD";
        recognitionRef.current.onresult = (e: any) => setLiveText(e.results[0][0].transcript);
        recognitionRef.current.onend = () => setStatus("idle");
      }
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (liveText) handleChat(liveText);
  }, [liveText]);

  const handleChat = async (text: string) => {
    setLiveText("");
    const updatedHistory = [...history, { role: "user" as Role, content: text }];
    setHistory(updatedHistory);
    setStatus("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistory }),
      });
      const data = await res.json();
      const reply = data.reply || "দুঃখিত, আমি বুঝতে পারিনি।";
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      setStatus("idle");
    }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "bn-BD";
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus("idle");
    synthRef.current.speak(utter);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">BijoyVoice AI</h1>
        <p className="text-zinc-500 mb-8">NB TECH Ecosystem</p>
        
        <div className="relative mb-8 flex justify-center">
          <div className={`absolute inset-0 bg-violet-500/20 blur-3xl rounded-full transition-opacity duration-500 ${status !== 'idle' ? 'opacity-100' : 'opacity-0'}`} />
          <button
            onClick={() => { setStatus("listening"); recognitionRef.current?.start(); }}
            className={`relative p-8 rounded-full transition-all duration-300 ${status === 'listening' ? 'bg-red-500 scale-110' : 'bg-violet-600 hover:bg-violet-500'}`}
          >
            {status === "listening" ? <MicOff size={40} /> : <Mic size={40} />}
          </button>
        </div>

        <div className="h-16 flex items-center justify-center text-xl font-medium">
          {status !== "idle" && <Sparkles className="mr-2 animate-pulse text-violet-400" />}
          {LABELS[status]}
        </div>
      </div>
    </div>
  );
}