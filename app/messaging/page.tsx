"use client";

export default function MessagesPageScalableExact() {
  return (
      <div className="bg-[#F7F7F5] text-on-surface min-h-screen overflow-x-hidden">
      {/* TopNavBar */}
            {/* Main Messaging Interface */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-gutter mt-24 lg:mt-[140px]">
        <div className="flex flex-col md:flex-row min-h-[680px] md:h-[750px] bg-white rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] overflow-hidden">
          {/* Left Column: Conversations */}
          <aside className="w-full md:w-1/3 border-r-0 md:border-r border-b md:border-b-0 border-[#EBEBE8] flex flex-col bg-surface">
            <div className="h-20 px-4 sm:px-lg flex items-center border-b border-[#EBEBE8] shrink-0">
              <h2 className="font-h2 text-h2 text-primary">
                Messages
              </h2>
            </div>
            <div className="px-4 sm:px-lg pb-md mt-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                  search
                </span>
                <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm font-manrope placeholder-stone-400 focus:ring-1 focus:ring-primary" placeholder="Search messages..." type="text" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Active Chat */}
              <div className="p-md flex items-center gap-md bg-[#F2F0E9] transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 shrink-0 border-2 border-primary">
                  <img className="w-full h-full object-cover" data-alt="A professional portrait of a man in his late 40s with a warm, trustworthy expression. He is wearing a minimalist linen shirt in a neutral tone, reflecting the Architectural Serenity design theme. The background is a soft-focus architectural interior with clean lines and natural light, using a palette of warm beiges and sage greens." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBMsgjkx_LPRHt1-w8Ut6UKWSYk5ralVBN2SH8-cgTdwi7IO0vrUchdAJZnhFXIklcLsUwNIKWTnrYAaEZyzTErrJMOxhMiSYiUTq95dMgrULa6YCOec4vIUxmNPwfYndoq-x6th116pJpuEMkt7piFAxzdmbyrlzxXPWR9jVjzln2Wy35r_OW92cLqsnDQDyjZHsgfYxnGcc1kyqmXkklNJJQ3ZDCTaanb8y_llRVBombL1FJZ4ruAwq5VeCSwo3pwjyCBW8C1gU" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-h3 text-body-md text-primary truncate">
                      Julian (Owner)
                    </span>
                    <span className="text-label-caps text-stone-400">
                      12:45 PM
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate font-medium">
                    The temperature control is set to a constant...
                  </p>
                </div>
              </div>
              {/* Other Conversations */}
              <div className="p-md flex items-center gap-md hover:bg-stone-50 transition-all cursor-pointer border-b border-[#F7F7F5]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 shrink-0">
                  <img className="w-full h-full object-cover" data-alt="A sleek, modern interior of a premium storage facility with architectural lighting and dark emerald accents. The space features clean lines, concrete floors, and glass elements. The overall mood is secure, serene, and sophisticated, aligning with the VaultSpace brand identity of high-value asset protection." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6d8J_Jzm4pjjWP0EvzWUW2B6f6fFk4BpH734kgSxNHML9QZXAAbYGZJS5nwmmPHw-1Cfkc0Dq1_WaGVcaIU34-x_US9o9cCFMQHRvArlUHtsrLo17RfBhmvZfgHq212m6vdYsT--KfZVGggaYNVEhNSPae4WddTH3f6qqjSWkHOWSnhdOU6q1q5DXvBrV_4Y7lIrC2vHov-S6Bm4bpdHdTiqX743DVl7V7yxjDcIMhxTJGCyegIg9FZrxMFZLiSSxAwavXlg2CPE" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-h3 text-body-md text-on-surface truncate">
                      The Emerald Vault
                    </span>
                    <span className="text-label-caps text-stone-400">
                      Yesterday
                    </span>
                  </div>
                  <p className="text-body-sm text-stone-500 truncate">
                    Your booking has been confirmed for next...
                  </p>
                </div>
              </div>
              <div className="p-md flex items-center gap-md hover:bg-stone-50 transition-all cursor-pointer border-b border-[#F7F7F5]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 shrink-0">
                  <img className="w-full h-full object-cover" data-alt="A portrait of a serene woman in professional attire, smiling softly. The lighting is natural and high-key, creating a modern and welcoming atmosphere. The composition emphasizes a clean, minimalist background with organic textures, echoing the brand's focus on calm and security." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqlaBtkz1hGP57hJ2q_Nne_NLm4PSCiBl5iqZXJ1DM0ECbLxZ5HLqfYUgNF1VuSmR5Pj4miHr1UzWYkOEUtImt5dJ9YDvuENxvCBZYtriek9CP9cOwJod2iyYiuqzNImX6WnlqTjAYJiHrgPl-9wxdVgCtJpeyFAzAIKGqBCS2Jewj-p5Fw0fDWnARLdXg4168wpn6_-7dX4Oh3V-kmP-9YOjCV1gwfchX48shk2G06uJAVrrwvahrRCErcAbaXF-Y6Pivv8lf4rY" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-h3 text-body-md text-on-surface truncate">
                      Sarah M.
                    </span>
                    <span className="text-label-caps text-stone-400">
                      Oct 24
                    </span>
                  </div>
                  <p className="text-body-sm text-stone-500 truncate">
                    Is there space for two large cabinets?
                  </p>
                </div>
              </div>
            </div>
          </aside>
          {/* Right Column: Chat Window */}
          <section className="flex-1 flex flex-col bg-white min-w-0">
            {/* Chat Header */}
            <header className="px-4 sm:px-lg py-4 md:py-0 md:h-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EBEBE8] shrink-0">
              <div className="flex items-center gap-md min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100">
                  <img className="w-full h-full object-cover" data-alt="Portrait of Julian, a storage space owner, in a high-end architectural setting with soft shadows and emerald green color touches. The style is premium and minimalist." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6C9w5Tqvfc-90F9fdaBHWaObKDwFDoXsXhzQ5pXeRgLhDB7p15rxNJ9eUWqcwncLUN0K-VwDPiSjZ5pX5ZQj2ow7MujHzGikGDfsRUSwQaEyjFR6BV4SRt1uTFTQmEnOOaDUHRBKorYf6mB4VONoBAMEwKniJ678K5i95jdPq-3x3Wdj65V0n5j_qzXLsxWKw-hIBbS5VqY9AKwrAwktcpBYdwR4J-pr7RZI910oKR7YoFXK9zOPBAf1QXrBC3nL6vprXmHB-CMQ" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-h3 text-body-md text-primary leading-tight truncate">
                    Julian (Owner)
                  </h3>
                  <div className="flex items-center gap-xs">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-label-caps text-stone-400">
                      Active now
                    </span>
                  </div>
                </div>
              </div>
              <button className="self-start sm:self-auto px-md py-2 border border-primary text-primary rounded-full font-label-caps hover:bg-stone-50 transition-all text-xs">
                
                        View Listing
                    
              </button>
            </header>
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-lg flex flex-col gap-lg bg-[#FCF9F8]">
              {/* Incoming Message */}
              <div className="flex flex-col gap-sm max-w-[86%] sm:max-w-[70%]">
                <div className="message-bubble message-bubble-incoming p-md bg-[#F2F0E9] text-body-md text-on-surface leading-relaxed">
                  
                            Hello! I saw your inquiry about the climate-controlled unit in West Chelsea. It's currently available and perfectly suited for fine art or vintage furniture.
                        
                </div>
                <span className="text-label-caps text-stone-400 px-sm">
                  12:30 PM
                </span>
              </div>
              {/* Outgoing Message */}
              <div className="flex flex-col gap-sm max-w-[86%] sm:max-w-[70%] self-end items-end">
                <div className="message-bubble message-bubble-outgoing p-md bg-[#0F3D3E] text-white text-body-md leading-relaxed shadow-sm">
                  
                            That sounds perfect. I have three large oil paintings that need consistent humidity levels. What is the exact temperature range?
                        
                </div>
                <span className="text-label-caps text-stone-400 px-sm">
                  12:42 PM
                </span>
              </div>
              {/* Incoming Message */}
              <div className="flex flex-col gap-sm max-w-[86%] sm:max-w-[70%]">
                <div className="message-bubble message-bubble-incoming p-md bg-[#F2F0E9] text-body-md text-on-surface leading-relaxed">
                  
                            The temperature control is set to a constant 21°C (70°F) with 50% relative humidity. We have secondary backup generators to ensure no fluctuations during power events.
                        
                </div>
                <span className="text-label-caps text-stone-400 px-sm">
                  12:45 PM
                </span>
              </div>
            </div>
            {/* Input Area */}
            <div className="border-t border-[#EBEBE8] bg-white p-4 sm:p-xl">
              <div className="flex items-center gap-md bg-[#F2F0E9]/50 rounded-full px-md py-sm border border-[#EBEBE8] focus-within:border-primary transition-colors">
                <button className="p-sm text-stone-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" data-icon="attach_file">
                    attach_file
                  </span>
                </button>
                <input className="flex-1 bg-transparent border-none focus:ring-0 text-body-md placeholder-stone-400 text-on-surface py-2" placeholder="Type your message..." type="text" />
                <button className="p-md bg-primary text-white rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-sm" data-icon="send">
                    send
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      {/* Footer */}
            </div>
  );
}
