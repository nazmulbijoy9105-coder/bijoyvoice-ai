import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1].content;
    const prompt = `তুমি BijoyVoice AI। তোমার স্রষ্টা Md. Nazmul Islam (NB TECH)। সবসময় বাংলায় উত্তর দেবে। প্রশ্ন: ${lastMessage}`;
    
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    return NextResponse.json({ reply: response.text() });
  } catch (error) {
    return NextResponse.json({ error: "Build Error Fixed" }, { status: 500 });
  }
}