'use client';

import Link from 'next/link';

export function AiAssistantSection() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="w-full px-6 lg:px-16">
        {/* Blue border container matching Figma */}
        <div className="border-4 border-[#C8714A] rounded-2xl overflow-hidden bg-white">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left - Robot/AI Image placeholder */}
            <div className="w-full lg:w-[400px] h-[250px] lg:h-[350px] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gray-400 rounded-2xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M19.8 14.5l-4.55 4.55a2.25 2.25 0 01-1.591.659H10.34a2.25 2.25 0 01-1.591-.659L4.2 14.5m15.6 0h-1.3m-13.2 0H4.2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right - Text content */}
            <div className="flex-1 p-8 lg:p-12 text-center lg:text-left">
              <p className="text-lg lg:text-2xl font-bold text-black font-mono mb-2">
                Unable to decide? Talk to
              </p>
              <h2 className="text-3xl lg:text-5xl font-black text-black font-mono mb-4">
                NEEV
              </h2>
              <p className="text-lg lg:text-2xl font-bold text-black font-mono">
                your AI travel planner who actually gets you!
              </p>
              <div className="mt-2 w-48 lg:w-64 h-1 bg-[#C8714A] mx-auto lg:mx-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
