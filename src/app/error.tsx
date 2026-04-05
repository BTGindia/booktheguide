"use client";
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-btg-cream">
        <div className="max-w-xl text-center p-8">
          <h1 className="text-3xl font-heading text-[#1A1A18] mb-4">Something went wrong</h1>
          <p className="text-sm text-[#6B6560] mb-6">An unexpected error occurred. You can try refreshing or go back to the homepage.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="px-5 py-2 bg-[#58bdae] text-white rounded-full font-heading">Refresh</button>
            <Link href="/" className="px-5 py-2 border border-[#1A1A18]/20 rounded-full text-[#1A1A18] font-body">Home</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
