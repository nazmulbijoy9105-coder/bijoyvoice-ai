"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function VoiceApp() {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [history, setHistory] = useState<Msg[]>([]);
  const [liveText, setLiveText] = useState("");
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const histRef = useRef<Msg[]>([]);

  useEffect(() => { histRef.current = history; }, [history]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (Speech) {
        const rec = new Speech();
        rec.lang = "bn-BD";
        rec.interimResults = true;
        rec.onresult = (e: any) => setLiveText(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
        rec.onend = () => {
          const text = liveText.trim();
          if (text) handleChat(text);
          else setStatus("idle");
        };
        recognitionRef.current = rec;
      }
      synthRef.current = window.speechSynthesis;
    }
  }, [liveText]);

  const handleChat = async (text: string) => {
    setLiveText("");
    const updatedHistory = [...histRef.current, { role: "user", content: text }];
    setHistory(updatedHistory);
    setStatus("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistory }),
      });
      const data = await res.json();
      const reply = data.reply || "Error occurred";
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch { setStatus("idle"); }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "bn-BD";
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus("idle");
    synthRef.current.speak(utter);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#04091a] text-white p-6">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">BijoyVoice AI</h1>
      
      <div className="w-full max-w-xl h-[400px] overflow-y-auto mb-6 space-y-4 custom-scrollbar">
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] ${m.role === "user" ? "bg-violet-600/30 border border-violet-500/50" : "bg-white/5 border border-white/10"}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => status === "listening" ? recognitionRef.current.stop() : (setStatus("listening"), recognitionRef.current.start())}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${status === "listening" ? "bg-red-500 animate-pulse" : "bg-gradient-to-tr from-violet-600 to-cyan-500"}`}
      >
        {status === "listening" ? <MicOff /> : <Mic />}
      </button>
      <p className="mt-4 opacity-60 capitalize">{status}</p>
    </div>
  );
}
