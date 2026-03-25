"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// VoiceApp-কে Dynamic Import করা হয়েছে যাতে এটি শুধুমাত্র ব্রাউজারে লোড হয় (No SSR Error)
const VoiceApp = dynamic(() => import("@/components/VoiceApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#04091a] flex flex-col items-center justify-center gap-4">
      {/* Premium Spinner for NB TECH Branding */}
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(139,92,246,0.3)]"></div>
      <p className="text-violet-200/50 text-xs tracking-[0.2em] uppercase animate-pulse">
        BijoyVoice Loading...
      </p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-[#04091a]">
      <Suspense fallback={null}>
        <VoiceApp />
      </Suspense>
    </main>
  );
}