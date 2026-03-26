import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bijoyvoice-ai.vercel.app"),
  title: "BijoyVoice AI",
  description: "বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট — NB TECH",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "BijoyVoice AI",
    description: "বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট — NB TECH",
    type: "website",
    locale: "bn_BD",
    url: "https://bijoyvoice-ai.vercel.app",
    siteName: "BijoyVoice AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#04091a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}