'use client';

import { MouseEvent } from 'react';
import { MessageCircle } from 'lucide-react';

export default function TalkToPabloButton() {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open-pablo-chat'));
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-[14px] font-bold text-white bg-[#FF7F50] px-7 py-3.5 rounded-full hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(255,127,80,0.35)] transition-all cursor-pointer"
    >
      <MessageCircle className="w-4 h-4" /> Talk to Pablo
    </button>
  );
}
