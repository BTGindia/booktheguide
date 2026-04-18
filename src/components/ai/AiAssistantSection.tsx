'use client';

import Link from 'next/link';
import Image from 'next/image';

export function AiAssistantSection() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="w-full px-6 lg:px-16">
        {/* Warm border container */}
        <div className="border-4 border-[#FF7F50] rounded-2xl overflow-hidden bg-white">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left - Pablo mascot */}
            <div className="w-full lg:w-[400px] h-[250px] lg:h-[350px] bg-gradient-to-br from-[#FFF5EE] to-[#FFE8D6] flex items-center justify-center flex-shrink-0">
              <div className="w-48 h-48 lg:w-56 lg:h-56 relative">
                <Image
                  src="/images/btg/pablo-mascot.png"
                  alt="Pablo — your AI travel buddy"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Right - Text content */}
            <div className="flex-1 p-8 lg:p-12 text-center lg:text-left">
              <p className="text-lg lg:text-2xl font-bold text-black font-mono mb-2">
                Unable to decide? Talk to
              </p>
              <h2 className="text-3xl lg:text-5xl font-black text-[#FF7F50] font-mono mb-4">
                Pablo
              </h2>
              <p className="text-lg lg:text-2xl font-bold text-black font-mono">
                your AI travel buddy who actually gets you!
              </p>
              <div className="mt-2 w-48 lg:w-64 h-1 bg-[#FF7F50] mx-auto lg:mx-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
