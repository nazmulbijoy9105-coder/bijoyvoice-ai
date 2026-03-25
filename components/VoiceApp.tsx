"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";

<<<<<<< HEAD
type Msg = { role: "user" | "assistant"; content: string };
=======
type Role = "user" | "assistant";
interface Msg { role: Role; content: string }

const GREETING = "আমি BijoyVoice AI। মাইক বাটন চাপুন এবং বাংলায় বলুন।";
const COLORS: Record<string, string> = {
  idle: "#c9a227",
  listening: "#ff4d4d",
  thinking: "#4dc9ff",
  speaking: "#4dff91",
};
const LABELS: Record<string, string> = {
  idle: "বলুন",
  listening: "শুনছি...",
  thinking: "ভাবছি...",
  speaking: "বলছি...",
};
>>>>>>> b7eb7b2 (Final production push: Integrated middleware, PWA icons, and API fixes)

export default function VoiceApp() {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [history, setHistory] = useState<Msg[]>([]);
  const [liveText, setLiveText] = useState("");
<<<<<<< HEAD
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const histRef = useRef<Msg[]>([]);

  useEffect(() => { histRef.current = history; }, [history]);

=======
  const [error, setError] = useState("");
  const [bars, setBars] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  const waveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recRef = useRef<any>(null);
  const liveRef = useRef("");
  const histRef = useRef<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { histRef.current = history; }, [history]);
  useEffect(() => { setMounted(true); }, []);
>>>>>>> b7eb7b2 (Final production push: Integrated middleware, PWA icons, and API fixes)
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

<<<<<<< HEAD
  const handleChat = async (text: string) => {
    setLiveText("");
    const updatedHistory = [...histRef.current, { role: "user", content: text }];
    setHistory(updatedHistory);
    setStatus("thinking");

=======
  const getSynth = () => (typeof window !== "undefined" ? window.speechSynthesis : null);

  const startWave = () => {
    if (waveTimer.current) clearInterval(waveTimer.current);
    waveTimer.current = setInterval(() => {
      setBars(Array.from({ length: 16 }, () => Math.floor(Math.random() * 70) + 8));
    }, 85);
  };

  const stopWave = () => {
    if (waveTimer.current) clearInterval(waveTimer.current);
    setBars([]);
  };

  const speakText = useCallback((text: string) => {
    const synth = getSynth();
    if (!synth) return;
    
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "bn-BD";
    u.rate = 1.0;
    u.onstart = () => { setStatus("speaking"); startWave(); };
    u.onend = () => { setStatus("idle"); stopWave(); };
    u.onerror = () => { setStatus("idle"); stopWave(); };
    synth.speak(u);
  }, []);

  const callAI = async (currentHistory: Msg[]) => {
>>>>>>> b7eb7b2 (Final production push: Integrated middleware, PWA icons, and API fixes)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ messages: updatedHistory }),
      });
      const data = await res.json();
      const reply = data.reply || "Error occurred";
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch { setStatus("idle"); }
  };
=======
        body: JSON.stringify({ messages: currentHistory }),
      });
      const data = await res.json();
      return data.reply || "দুঃখিত, আমি এটি বুঝতে পারিনি।";
    } catch {
      return "দুঃখিত, সংযোগে সমস্যা হয়েছে।";
    }
  };

  const handleMic = useCallback(async () => {
    if (status === "speaking" || status === "thinking") {
      getSynth()?.cancel();
      recRef.current?.abort();
      setStatus("idle");
      stopWave();
      return;
    }

    const SR = typeof window !== "undefined" && (window.SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) { setError("দয়া করে Chrome ব্রাউজার ব্যবহার করুন।"); return; }

    const rec = new SR();
    rec.lang = "bn-BD";
    rec.interimResults = true;
    recRef.current = rec;

    rec.onstart = () => { setStatus("listening"); startWave(); setError(""); };
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      liveRef.current = t;
      setLiveText(t);
    };

    rec.onend = async () => {
      stopWave();
      const said = liveRef.current.trim();
      setLiveText("");
      if (!said) { setStatus("idle"); return; }

      const updatedHistory: Msg[] = [...histRef.current, { role: "user", content: said }];
      setHistory(updatedHistory);
      setStatus("thinking");

      const reply = await callAI(updatedHistory);
      const finalHistory: Msg[] = [...updatedHistory, { role: "assistant", content: reply }];
      
      setHistory(finalHistory);
      speakText(reply);
    };

    rec.onerror = () => { setStatus("idle"); stopWave(); };
    rec.start();
  }, [status, speakText]);
>>>>>>> b7eb7b2 (Final production push: Integrated middleware, PWA icons, and API fixes)

  const speak = (text: string) => {
    if (!synthRef.current) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "bn-BD";
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus("idle");
    synthRef.current.speak(utter);
  };

  return (
<<<<<<< HEAD
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
=======
    <div style={{
      height: "100dvh", background: "linear-gradient(160deg,#04091a 0%,#070d1e 50%,#0b1830 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
    }}>
      {/* Ambient Glows */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,162,39,0.05) 0%,transparent 70%)", top: -180, right: -120, pointerEvents: "none" }} />

      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(201,162,39,0.1)", background: "rgba(4,9,26,0.8)", backdropFilter: "blur(10px)", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#c9a227", fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>NB TECH</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>BijoyVoice AI</div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#c9a227,#7a5c0a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(201,162,39,0.3)" }}>🎙️</div>
      </header>

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {history.length === 0 && <Bubble role="assistant" text={GREETING} />}
        {history.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
        {liveText && <div style={{ display: "flex", justifyContent: "flex-end" }}><div style={{ maxWidth: "80%", background: "rgba(201,162,39,0.1)", border: "1px dashed #c9a22766", borderRadius: "15px", padding: "10px 15px", fontStyle: "italic", color: "#c9a227" }}>{liveText}</div></div>}
        <div ref={bottomRef} />
      </div>

      <footer style={{ padding: "20px 24px 40px", background: "rgba(4,9,26,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", gap: 15 }}>
        <div style={{ height: 30, display: "flex", alignItems: "center", gap: 3 }}>
          {bars.map((h, i) => <div key={i} style={{ width: 3, height: `${h * 0.4}px`, background: COLORS[status], borderRadius: 2, transition: "height 0.1s ease" }} />)}
        </div>
        
        <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS[status], textTransform: "uppercase", fontWeight: 600 }}>{LABELS[status]}</div>

        <button onClick={handleMic} style={{ width: 80, height: 80, borderRadius: "50%", border: "none", cursor: "pointer", background: status === "listening" ? "radial-gradient(circle,#ff4d4d,#991b1b)" : "radial-gradient(circle,#c9a227,#8a6c10)", boxShadow: `0 0 30px ${COLORS[status]}44`, transition: "all 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MicIcon status={status} />
        </button>

        {history.length > 0 && <button onClick={() => { setHistory([]); setError(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", padding: "6px 20px", borderRadius: "20px", fontSize: 12, cursor: "pointer" }}>নতুন কথোপকথন</button>}
        {error && <div style={{ color: "#ff4d4d", fontSize: 12, textAlign: "center" }}>{error}</div>}
      </footer>
    </div>
  );
}

function Bubble({ role, text }: { role: Role; text: string }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "85%", padding: "12px 16px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg,rgba(201,162,39,0.15),rgba(4,9,26,0.4))" : "rgba(255,255,255,0.05)", border: `1px solid ${isUser ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.1)"}`, color: "#efefef", fontSize: 15, lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  );
}

function MicIcon({ status }: { status: string }) {
  if (status === "thinking") return <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, background: "#fff", borderRadius: "50%", animation: "bounce 0.6s infinite alternate", animationDelay: `${i * 0.2}s` }} />)}</div>;
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
      {status === "speaking" 
        ? <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        : <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      }
    </svg>
  );
}
>>>>>>> b7eb7b2 (Final production push: Integrated middleware, PWA icons, and API fixes)
