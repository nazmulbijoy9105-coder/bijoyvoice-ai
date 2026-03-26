import type { Metadata, Viewport } from "next";
import "./globals.css";

// Metadata for SEO, PWA, and Social Media
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://bijoyvoice-ai.vercel.app" // ✅ your production domain
      : "http://localhost:3000"            // ✅ dev fallback
  ),
  title: "BijoyVoice AI",
  description: "বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট — NB TECH",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  // Social Media Preview (Open Graph)
  openGraph: {
    title: "BijoyVoice AI",
    description: "বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট — NB TECH",
    type: "website",
    locale: "bn_BD",
    url: "https://bijoyvoice-ai.vercel.app", // ✅ match production domain
    siteName: "BijoyVoice AI",
    images: [
      {
        url: "/og-image.png", // relative path now resolves correctly
        width: 1200,
        height: 630,
        alt: "BijoyVoice AI",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BijoyVoice AI",
  },
};

// Viewport for Mobile Responsiveness and Theme
export const viewport: Viewport = {
  themeColor: "#04091a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        {/* Mobile Web App Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Font Loading Strategy: Preconnecting improves LCP speed */}
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