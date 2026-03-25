import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

<<<<<<< HEAD
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
=======
// System Prompt for consistent identity
const SYSTEM_INSTRUCTION = `তুমি BijoyVoice AI — একটি বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট। তুমি সবসময় বাংলায় উত্তর দেবে, সহজ ও স্বাভাবিক কথোপকথনের ভাষায়। তুমি সব ধরনের প্রশ্নের উত্তর দিতে পারো — আইন, প্রযুক্তি, দৈনন্দিন জীবন, বিনোদন, সব কিছু। উত্তর সংক্ষিপ্ত ও স্পষ্ট রাখো। তুমি NB TECH এর পণ্য।`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages } = body;

    // 1. Validation for empty input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // 2. Context Window Optimization
    // শুধুমাত্র শেষ ১০-১৫টি মেসেজ পাঠানো হচ্ছে যাতে টোকেন খরচ বাঁচে এবং রেসপন্স ফাস্ট হয়
    const recentMessages = messages.slice(-15);

    // 3. Proper Chat History Formatting
    const history = recentMessages.slice(0, -1).map((m: { role: string; content: string }) => ({
>>>>>>> b7eb7b2 (Final production push: Integrated middleware, PWA icons, and API fixes)
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || "" }],
    }));

<<<<<<< HEAD
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
=======
    const lastMsg = recentMessages[recentMessages.length - 1].content;
    
    if (!lastMsg) {
      return NextResponse.json({ error: "Last message is empty" }, { status: 400 });
    }

    const chat = model.startChat({ history });

    // 4. API Call with safety
    const result = await chat.sendMessage(lastMsg);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    // 5. Success Response
    return NextResponse.json({ reply: responseText.trim() });

  } catch (error: any) {
    // 6. Detailed Error Logging (Server side only)
    console.error("BijoyVoice API Error:", error.message || error);

    // User friendly Bengali error message
    return NextResponse.json(
      { reply: "দুঃখিত, বর্তমানে সংযোগে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
      { status: 500 }
    );
>>>>>>> b7eb7b2 (Final production push: Integrated middleware, PWA icons, and API fixes)
  }
}

// Optional: Edge runtime for faster response (if Gemini SDK supports it)
// export const runtime = 'edge';