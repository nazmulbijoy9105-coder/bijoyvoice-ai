import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `তুমি BijoyVoice AI — একটি বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট। তুমি সবসময় বাংলায় উত্তর দেবে। উত্তর সংক্ষিপ্ত ও স্পষ্ট রাখো। তুমি NB TECH এর তৈরি একটি উন্নত AI।`;

const jsonResponse = (data: any, status = 200) => 
  NextResponse.json(data, { 
    status, 
    headers: { "Cache-Control": "no-store, max-age=0" } 
  });

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return jsonResponse({ error: "Server Configuration Error" }, 500);

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) return jsonResponse({ error: "Invalid Request" }, 400);

    const cleanMessages = body.messages
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content?.trim().substring(0, 1000) || "",
      }))
      .filter((m: any) => m.content !== "")
      .slice(-15);

    const lastMsg = cleanMessages[cleanMessages.length - 1].content;
    const history = cleanMessages.slice(0, -1).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMsg);
    const reply = result.response.text().trim() || "দুঃখিত, আমি বুঝতে পারিনি।";

    return jsonResponse({ reply });
  } catch (error) {
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
}
