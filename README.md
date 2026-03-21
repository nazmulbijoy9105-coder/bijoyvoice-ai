# 🎙️ BijoyVoice AI
**বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট — NB TECH**

A Siri-style Bangla voice assistant. Speak in Bangla → AI answers in Bangla → speaks back to you.

## Stack
| Layer | Tech | Cost |
|---|---|---|
| Frontend | Next.js 15 PWA | Free — Vercel |
| AI | Gemini 2.0 Flash | Free — 1,500 req/day |
| STT | Web Speech API (bn-BD) | Free — Browser |
| TTS | Web Speech Synthesis | Free — Browser |

---

## 🚀 Deploy in 5 Steps

### Step 1 — Get Gemini API Key (Free)
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "init: BijoyVoice AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bijoyvoice-ai.git
git push -u origin main
```

### Step 3 — Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Add environment variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** your key from Step 1
4. Click **Deploy**

### Step 4 — Install as App on Android
1. Open your Vercel URL in Chrome
2. Tap the **⋮ menu → Add to Home screen**
3. Now it works like a real app!

### Step 5 — Allow Microphone
- When you tap the mic button, Chrome will ask for mic permission
- Tap **Allow**
- Done!

---

## Features
- 🎙️ Bangla Speech-to-Text (bn-BD)
- 🤖 Gemini 2.0 Flash AI (full Bangla NLP)
- 🔊 Bangla Text-to-Speech
- 💬 Conversation history (current session)
- 📱 PWA — installable on Android/iPhone
- 🌙 Dark navy/gold UI (NB TECH brand)
- 🆓 100% free tier infrastructure

---

## Local Dev (optional)
```bash
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm install
npm run dev
```

---

*NB TECH — Built by Md Nazmul Islam (Bijoy)*
