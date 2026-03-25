import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ১. Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // ২. Content Security Policy (CSP)
  // এটি আপনার Gemini API এবং Google Fonts কে এলাও করবে কিন্তু বাইরের অ্যাটাক ঠেকাবে
  response.headers.set(
    'Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com;"
  );

  // ৩. Permissions-Policy: ভয়েস অ্যাসিস্ট্যান্টের জন্য মাইক পারমিশন নিশ্চিত করা
  response.headers.set('Permissions-Policy', 'microphone=(self)');

  return response;
}

// ৪. Matcher Configuration
export const config = {
  matcher: [
    /*
     * নিচের ফাইলগুলোকে মিডলওয়্যার থেকে বাদ দেওয়া হয়েছে যাতে ৪0৪ না আসে:
     * - api, _next/static, _next/image, favicon.ico, icon-, manifest.json
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon-|manifest.json).*)',
  ],
};