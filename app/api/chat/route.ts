import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4000;

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
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction:
      "তুমি BijoyVoice AI। তোমার স্রষ্টা Md. Nazmul Islam (NB TECH)। সবসময় স্বাভাবিক, স্পষ্ট বাংলায় উত্তর দাও। প্রয়োজনে সংক্ষিপ্ত রাখো।",
    generationConfig: {
      maxOutputTokens: 768,
      temperature: 0.85,
    },
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const lastUser = messages[messages.length - 1].content;

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUser);
    const text = result.response.text()?.trim();
    return NextResponse.json({
      reply: text || "দুঃখিত, এখন কিছু বলতে পারছি না।",
    });
  } catch (e) {
    console.error("[api/chat]", e);
    return NextResponse.json(
      {
        reply: "দুঃখিত, AI সেবায় সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।",
        error: process.env.NODE_ENV === "development" ? String(e) : undefined,
        code: "MODEL_ERROR",
      },
      { status: 502 }
    );
  }
}
