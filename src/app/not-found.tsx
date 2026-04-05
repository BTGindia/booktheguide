import Link from 'next/link';

export default function NotFound() {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-btg-cream">
        <div className="text-center p-8">
          <h1 className="text-4xl font-heading text-[#1A1A18] mb-4">Page not found</h1>
          <p className="text-sm text-[#6B6560] mb-6">We couldn’t find the page you’re looking for.</p>
          <Link href="/" className="px-5 py-2 bg-[#58bdae] text-white rounded-full font-heading">Go Home</Link>
        </div>
      </body>
    </html>
  );
}
