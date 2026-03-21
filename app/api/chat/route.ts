import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM = `তুমি BijoyVoice AI — একটি বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট। তুমি সবসময় বাংলায় উত্তর দেবে, সহজ ও স্বাভাবিক কথোপকথনের ভাষায়। তুমি সব ধরনের প্রশ্নের উত্তর দিতে পারো — আইন, প্রযুক্তি, দৈনন্দিন জীবন, বিনোদন, সব কিছু। উত্তর সংক্ষিপ্ত ও স্পষ্ট রাখো। তুমি NB TECH এর পণ্য।`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM,
    });

    // Build history (all but last message)
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMsg = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMsg);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ reply: "দুঃখিত, সংযোগে সমস্যা হয়েছে।" });
  }
}
