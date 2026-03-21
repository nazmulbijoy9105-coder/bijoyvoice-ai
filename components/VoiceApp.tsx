"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Role = "user" | "assistant";
interface Msg { role: Role; content: string }

const GREETING = "আমি BijoyVoice AI। মাইক বাটন চাপুন এবং বাংলায় বলুন।";
const C: Record<string, string> = {
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

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceApp() {
  const [status, setStatus] = useState("idle");
  const [history, setHistory] = useState<Msg[]>([]);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState("");
  const [bars, setBars] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  const waveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const liveRef = useRef("");
  const histRef = useRef<Msg[]>([]);
  const statusRef = useRef("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { histRef.current = history; }, [history]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, liveText]);

  const getSynth = () => {
    try { return typeof window !== "undefined" && window.speechSynthesis ? window.speechSynthesis : null; }
    catch { return null; }
  };

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
    if (!synth) { setStatus("idle"); return; }
    try { synth.cancel(); } catch { /* ignore */ }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "bn-BD";
    u.rate = 0.93;
    u.pitch = 1.0;
    u.volume = 1.0;
    u.onstart = () => { setStatus("speaking"); startWave(); };
    u.onend = () => { setStatus("idle"); stopWave(); };
    u.onerror = () => { setStatus("idle"); stopWave(); };
    try { synth.speak(u); } catch { setStatus("idle"); }
  }, []);

  const callAI = useCallback(async (userText: string) => {
    setStatus("thinking");
    const msgs = [
      ...histRef.current,
      { role: "user" as Role, content: userText },
    ];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
      const data = await res.json();
      return (data.reply as string) || "দুঃখিত, বুঝতে পারিনি।";
    } catch {
      return "দুঃখিত, সংযোগে সমস্যা হয়েছে।";
    }
  }, []);

  const handleMic = useCallback(() => {
    const cur = statusRef.current;

    if (cur === "speaking" || cur === "thinking") {
      try { getSynth()?.cancel(); } catch { /* ignore */ }
      try { recRef.current?.abort(); } catch { /* ignore */ }
      setStatus("idle"); stopWave(); return;
    }

    if (cur === "listening") {
      try { recRef.current?.stop(); } catch { /* ignore */ }
      return;
    }

    const SR = typeof window !== "undefined"
      && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setError("Chrome ব্রাউজার ব্যবহার করুন।"); return; }

    const rec = new SR();
    rec.lang = "bn-BD";
    rec.continuous = false;
    rec.interimResults = true;
    recRef.current = rec;
    liveRef.current = "";

    rec.onstart = () => { setStatus("listening"); setLiveText(""); setError(""); startWave(); };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      liveRef.current = t;
      setLiveText(t);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      stopWave(); setStatus("idle");
      if (e.error === "not-allowed") setError("মাইক অ্যাক্সেস দিন — ব্রাউজার সেটিংস চেক করুন।");
      else if (e.error === "no-speech") setError("কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।");
      else setError("আবার চেষ্টা করুন।");
    };

    rec.onend = async () => {
      stopWave();
      const said = liveRef.current.trim();
      setLiveText("");
      if (!said) { setStatus("idle"); return; }

      const userMsg: Msg = { role: "user", content: said };
      setHistory(prev => [...prev, userMsg]);
      histRef.current = [...histRef.current, userMsg];

      const reply = await callAI(said);
      const botMsg: Msg = { role: "assistant", content: reply };
      setHistory(prev => [...prev, botMsg]);
      histRef.current = [...histRef.current, botMsg];

      speakText(reply);
    };

    try { rec.start(); }
    catch { setError("মাইক চালু করা যায়নি।"); setStatus("idle"); }
  }, [callAI, speakText]);

  const doReset = () => {
    try { getSynth()?.cancel(); } catch { /* ignore */ }
    try { recRef.current?.abort(); } catch { /* ignore */ }
    setHistory([]); histRef.current = [];
    setStatus("idle"); setLiveText(""); stopWave(); setError("");
  };

  if (!mounted) return null;

  return (
    <div style={{
      height: "100dvh",
      background: "linear-gradient(160deg,#04091a 0%,#070d1e 50%,#0b1830 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Noto Serif Bengali',Georgia,serif",
      overflow: "hidden", position: "relative",
    }}>
      {/* Ambient glows */}
      <div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(201,162,39,0.07) 0%,transparent 70%)",
        top:-180,right:-120,pointerEvents:"none" }} />
      <div style={{ position:"absolute",width:400,height:400,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(77,120,255,0.05) 0%,transparent 70%)",
        bottom:-120,left:-100,pointerEvents:"none" }} />

      {/* ── HEADER ── */}
      <header style={{
        padding:"14px 20px 12px",
        borderBottom:"1px solid rgba(201,162,39,0.13)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(4,9,26,0.8)", backdropFilter:"blur(14px)", zIndex:10,
        flexShrink: 0,
      }}>
        <div>
          <div style={{color:"#c9a227",fontSize:9,letterSpacing:4,marginBottom:2,textTransform:"uppercase"}}>NB TECH</div>
          <div style={{color:"#fff",fontSize:19,fontWeight:700,lineHeight:1.2}}>BijoyVoice AI</div>
          <div style={{color:"rgba(255,255,255,0.28)",fontSize:10,marginTop:2}}>বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট</div>
        </div>
        <div style={{
          width:44,height:44,borderRadius:"50%",
          background:"linear-gradient(135deg,#c9a227,#7a5c0a)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:20, flexShrink:0,
          boxShadow:"0 0 20px rgba(201,162,39,0.3)",
        }}>🎙️</div>
      </header>

      {/* ── CHAT ── */}
      <div style={{
        flex:1, overflowY:"auto", padding:"16px 14px 8px",
        display:"flex", flexDirection:"column", gap:11,
      }}>
        {history.length === 0 && <Bubble role="assistant" text={GREETING} />}

        {history.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}

        {liveText && (
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <div style={{
              maxWidth:"82%",
              background:"rgba(201,162,39,0.07)",
              border:"1px dashed rgba(201,162,39,0.38)",
              borderRadius:"16px 16px 4px 16px",
              padding:"10px 14px",color:"rgba(201,162,39,0.82)",
              fontSize:14,lineHeight:1.75,fontStyle:"italic",
            }}>{liveText}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── WAVEFORM ── */}
      <div style={{
        height:48,display:"flex",alignItems:"center",
        justifyContent:"center",gap:3,flexShrink:0,
      }}>
        {bars.length > 0
          ? bars.map((h, i) => (
              <div key={i} style={{
                width:3,borderRadius:2,
                height:`${h * 0.42}px`,
                background:C[status],opacity:0.7,
                transition:"height 0.08s ease",
              }}/>
            ))
          : <div style={{color:"rgba(255,255,255,0.1)",fontSize:11,letterSpacing:5}}>· · · · ·</div>
        }
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          textAlign:"center",fontSize:12,color:"#ff7070",
          padding:"0 20px 6px",lineHeight:1.5,flexShrink:0,
        }}>{error}</div>
      )}

      {/* ── BOTTOM CONTROLS ── */}
      <footer style={{
        padding:"8px 24px 32px",
        borderTop:"1px solid rgba(201,162,39,0.1)",
        display:"flex",flexDirection:"column",alignItems:"center",gap:9,
        background:"rgba(4,9,26,0.88)",backdropFilter:"blur(14px)",
        flexShrink:0,
      }}>
        <div style={{
          fontSize:10,letterSpacing:3,textTransform:"uppercase",
          color:C[status],transition:"color 0.3s",
        }}>{LABELS[status]}</div>

        <button
          onClick={handleMic}
          aria-label="মাইক"
          style={{
            width:74,height:74,borderRadius:"50%",border:"none",
            cursor:"pointer",
            background: status==="listening"
              ? "radial-gradient(circle at 38% 32%,#ff7070,#c62828)"
              : status==="thinking"
              ? "radial-gradient(circle at 38% 32%,#5cd4ff,#0d3d52)"
              : status==="speaking"
              ? "radial-gradient(circle at 38% 32%,#5dffa0,#0d5229)"
              : "radial-gradient(circle at 38% 32%,#e0b82e,#8a6c10)",
            boxShadow: status==="listening"
              ? "0 0 0 0 rgba(255,77,77,0.55)"
              : `0 0 ${status==="idle"?"28px":"50px"} ${C[status]}55`,
            animation: status==="listening" ? "pulse-ring 1.2s infinite" : "none",
            transition:"background 0.3s, box-shadow 0.3s",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}
        >
          <MicIcon status={status} />
        </button>

        {history.length > 0 && (
          <button onClick={doReset} style={{
            background:"transparent",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:20,padding:"5px 18px",
            color:"rgba(255,255,255,0.28)",cursor:"pointer",
            fontSize:11,letterSpacing:1,
            fontFamily:"inherit",
          }}>নতুন কথোপকথন</button>
        )}
      </footer>
    </div>
  );
}

function Bubble({ role, text }: { role: Role; text: string }) {
  return (
    <div style={{display:"flex",justifyContent:role==="user"?"flex-end":"flex-start"}}>
      <div style={{
        maxWidth:"82%",
        background:role==="user"
          ?"linear-gradient(135deg,rgba(201,162,39,0.2),rgba(201,162,39,0.06))"
          :"rgba(255,255,255,0.05)",
        border:role==="user"
          ?"1px solid rgba(201,162,39,0.3)"
          :"1px solid rgba(255,255,255,0.09)",
        borderRadius:role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
        padding:"11px 15px",color:"#ddd",fontSize:15,lineHeight:1.8,
      }}>{text}</div>
    </div>
  );
}

function MicIcon({ status }: { status: string }) {
  if (status === "thinking") return (
    <span style={{display:"flex",gap:5,alignItems:"center"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          width:7,height:7,borderRadius:"50%",
          background:"#fff",opacity:0.9,
          animation:`bounce 0.9s ${i*0.15}s infinite ease-in-out`,
        }}/>
      ))}
    </span>
  );
  if (status === "speaking") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  );
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  );
}
