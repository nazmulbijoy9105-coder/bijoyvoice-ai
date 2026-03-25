/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // কোড কমপ্রেশন দ্রুত করার জন্য
  
  // সিকিউরিটি হেডার কনফিগারেশন
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // ক্লিকজ্যাকিং প্রোটেকশন
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // MIME টাইপ স্নিফিং প্রতিরোধ
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "microphone=(self)", // শুধু আপনার সাইটেই মাইক কাজ করবে
          },
        ],
      },
    ];
  },

  // ইমেজের জন্য ডোমেইন হোয়াইটলিস্ট (যদি ভবিষ্যতে Google/GitHub প্রোফাইল পিকচার দেখান)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // বিল্ড টাইমে টাইপ চেকিং এবং লিন্টিং ইগনোর (Vercel-এ দ্রুত বিল্ড হওয়ার জন্য, তবে লোকালি রান করা ভালো)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;