/**
 * Server env (Vercel: Project → Settings → Environment Variables):
 * - GEMINI_API_KEY   — required. Create: https://aistudio.google.com/app/apikey
 * - GEMINI_MODEL     — optional. Use exact id OR plain words (see normalizeGeminiModelId).
 * - NEXT_PUBLIC_*    — only for browser; this route does not read NEXT_PUBLIC_SITE_URL.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4000;

/** Tried in order after GEMINI_MODEL (if set). Keep 1.5-flash first — widest API support. */
const MODEL_FALLBACKS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"] as const;

const SYSTEM_INSTRUCTION =
  "তুমি BijoyVoice AI—ব্যবহারকারীর ব্যক্তিগত বাংলা ভয়েস সহকারী। স্রষ্টা Md. Nazmul Islam (NB TECH)। স্বাভাবিক, স্পষ্ট বাংলায় উত্তর দাও; ব্যবহারকারীর তথ্য প্রকাশ বা শেয়ার করার পরামর্শ দিও না। প্রয়োজনে সংক্ষিপ্ত রাখো।";

type Role = "user" | "assistant";

interface IncomingMessage {
  role?: string;
  content?: unknown;
}

function normalizeMessages(raw: unknown): { ok: true; messages: { role: Role; content: string }[] } | { ok: false; message: string; code: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, message: "বার্তা খুঁজে পাইনি।", code: "NO_MESSAGES" };
  }

  const sliced = raw.slice(-MAX_MESSAGES) as IncomingMessage[];
  const messages: { role: Role; content: string }[] = [];

  for (const m of sliced) {
    const role: Role = m.role === "assistant" ? "assistant" : "user";
    const content = typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_CHARS).trim() : "";
    if (content.length === 0) continue;
    messages.push({ role, content });
  }

  if (messages.length === 0) {
    return { ok: false, message: "খালি বার্তা গ্রহণযোগ্য নয়।", code: "EMPTY" };
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return { ok: false, message: "শেষ বার্তা ব্যবহারকারীর হতে হবে।", code: "BAD_TURN" };
  }

  return { ok: true, messages };
}

/**
 * Maps human / tool labels to Google model ids (no spaces in final id).
 * Examples: "gemini 1,5 flash", "gemini 1.5 flasg" → gemini-1.5-flash
 */
function normalizeGeminiModelId(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  const lower = t.toLowerCase().replace(/,/g, ".").replace(/flasg/g, "flash");
  const spaced = lower.replace(/\s+/g, " ").trim();
  if (spaced.includes("1.5") && spaced.includes("flash")) return "gemini-1.5-flash";
  if (spaced.includes("2.0") && spaced.includes("flash")) return "gemini-2.0-flash";
  if (spaced.includes("1.5") && spaced.includes("pro")) return "gemini-1.5-pro";
  if (spaced.includes("2.0") && spaced.includes("pro")) return "gemini-2.0-pro";
  const noSpace = lower.replace(/\s+/g, "");
  if (/^gemini-[\w.-]+$/i.test(noSpace)) return noSpace;
  const hyphen = lower.replace(/\s+/g, "-");
  if (hyphen === "gemini-1-5-flash" || hyphen === "gemini-1.5-flash") return "gemini-1.5-flash";
  return undefined;
}

function uniqueModels(preferred: string | undefined): string[] {
  const list = [preferred?.trim() || "", ...MODEL_FALLBACKS].filter(Boolean);
  return [...new Set(list)];
}

/** SDK returns `.text()` at runtime; package typings omit it in some versions */
function safeText(response: unknown): string | null {
  try {
    if (!response || typeof response !== "object") return null;
    const textFn = (response as { text?: unknown }).text;
    if (typeof textFn !== "function") return null;
    const t = (textFn as () => string)()?.trim();
    return t || null;
  } catch {
    return null;
  }
}

async function tryChat(
  key: string,
  modelName: string,
  useSystemInstruction: boolean,
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  lastUser: string
): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(useSystemInstruction ? { systemInstruction: SYSTEM_INSTRUCTION } : {}),
    generationConfig: {
      maxOutputTokens: 768,
      temperature: 0.85,
    },
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastUser);
  return safeText(result.response);
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        reply: null,
        error: "সার্ভারে GEMINI_API_KEY সেট করা নেই।",
        code: "NO_API_KEY",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: null, error: "অবৈধ JSON।", code: "BAD_JSON" }, { status: 400 });
  }

  const payload = body as { messages?: unknown };
  const parsed = normalizeMessages(payload.messages);
  if (!parsed.ok) {
    return NextResponse.json({ reply: null, error: parsed.message, code: parsed.code }, { status: 400 });
  }

  const { messages } = parsed;
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));
  const lastUser = messages[messages.length - 1].content;

  const envModel = normalizeGeminiModelId(process.env.GEMINI_MODEL?.trim());
  const modelOrder = uniqueModels(envModel);
  let lastErr: unknown;

  for (const modelName of modelOrder) {
    for (const useSys of [true, false]) {
      try {
        const text = await tryChat(key, modelName, useSys, history, lastUser);
        if (text) {
          return NextResponse.json({ reply: text });
        }
      } catch (e) {
        lastErr = e;
        console.error(`[api/chat] ${modelName} system=${useSys}`, e);
      }
    }
  }

  console.error("[api/chat] all retries failed", lastErr);
  return NextResponse.json(
    {
      reply: "দুঃখিত, AI সেবায় সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।",
      error:
        process.env.NODE_ENV === "development" && lastErr != null
          ? String(lastErr)
          : "Vercel এ GEMINI_API_KEY সেট করুন। মডেল: GEMINI_MODEL=gemini-1.5-flash (ঠিক এই স্পেলিং, স্পেস নয়)।",
      code: "MODEL_ERROR",
    },
    { status: 502 }
  );
}
