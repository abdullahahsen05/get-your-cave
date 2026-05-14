"use client";

export default function MessagesPageScalableExact() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          scroll-behavior: smooth;
        }

        :global(body) {
          margin: 0;
          background: #f7f7f5;
          font-family: Manrope, sans-serif;
          color: #1c1b1b;
        }

        :global(.material-symbols-outlined) {
          font-family: "Material Symbols Outlined";
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: "liga";
          -webkit-font-smoothing: antialiased;
          font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
        }

        :global(.font-body-md),
        :global(.font-body-sm),
        :global(.font-body-lg),
        :global(.font-h1),
        :global(.font-h2),
        :global(.font-h3),
        :global(.font-display),
        :global(.font-label-caps),
        :global(.font-italic-emphasis),
        :global(.font-manrope) {
          font-family: Manrope, sans-serif;
        }

        :global(.font-label-caps) {
          font-size: 12px;
          line-height: 1;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        :global(.font-h1) {
          font-size: 36px;
          line-height: 1.2;
          letter-spacing: -0.01em;
          font-weight: 700;
        }
        :global(.font-h2) {
          font-size: 28px;
          line-height: 1.3;
          font-weight: 700;
        }
        :global(.font-h3) {
          font-size: 22px;
          line-height: 1.4;
          font-weight: 600;
        }
        :global(.font-body-md) {
          font-size: 16px;
          line-height: 1.6;
          font-weight: 400;
        }
        :global(.font-body-sm) {
          font-size: 14px;
          line-height: 1.5;
          font-weight: 400;
        }
        :global(.font-body-lg) {
          font-size: 18px;
          line-height: 1.6;
          font-weight: 400;
        }
        :global(.font-display) {
          font-size: 48px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 800;
        }

        :global(.text-body-sm) {
          font-size: 14px;
          line-height: 1.5;
        }
        :global(.text-body-md) {
          font-size: 16px;
          line-height: 1.6;
        }
        :global(.text-body-lg) {
          font-size: 18px;
          line-height: 1.6;
        }
        :global(.text-label-caps) {
          font-size: 12px;
          line-height: 1;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        :global(.text-h2) {
          font-size: 28px;
          line-height: 1.3;
          font-weight: 700;
        }
        :global(.text-h3) {
          font-size: 22px;
          line-height: 1.4;
          font-weight: 600;
        }

        :global(.rounded) {
          border-radius: 1rem;
        }
        :global(.rounded-lg) {
          border-radius: 2rem;
        }
        :global(.rounded-xl) {
          border-radius: 3rem;
        }

        :global(.gap-xs) {
          gap: 4px;
        }
        :global(.gap-sm) {
          gap: 8px;
        }
        :global(.gap-md) {
          gap: 16px;
        }
        :global(.gap-lg) {
          gap: 24px;
        }
        :global(.gap-gutter) {
          gap: 24px;
        }
        :global(.px-gutter) {
          padding-left: 24px;
          padding-right: 24px;
        }
        :global(.px-lg) {
          padding-left: 24px;
          padding-right: 24px;
        }
        :global(.p-lg) {
          padding: 24px;
        }
        :global(.p-xl) {
          padding: 48px;
        }
        :global(.p-md) {
          padding: 16px;
        }
        :global(.p-sm) {
          padding: 8px;
        }
        :global(.px-md) {
          padding-left: 16px;
          padding-right: 16px;
        }
        :global(.px-sm) {
          padding-left: 8px;
          padding-right: 8px;
        }
        :global(.py-sm) {
          padding-top: 8px;
          padding-bottom: 8px;
        }
        :global(.mt-xxl) {
          margin-top: 80px;
        }

        :global(.bg-background) {
          background-color: #fcf9f8;
        }
        :global(.bg-surface) {
          background-color: #fcf9f8;
        }
        :global(.bg-surface-container-low) {
          background-color: #f6f3f2;
        }
        :global(.bg-surface-container) {
          background-color: #f0eded;
        }
        :global(.bg-surface-container-high) {
          background-color: #eae7e7;
        }
        :global(.bg-surface-container-lowest) {
          background-color: #ffffff;
        }
        :global(.bg-primary) {
          background-color: #002627;
        }
        :global(.bg-primary-container) {
          background-color: #0f3d3e;
        }
        :global(.bg-secondary) {
          background-color: #4b6547;
        }
        :global(.bg-secondary-container) {
          background-color: #cdebc5;
        }

        :global(.text-on-surface) {
          color: #1c1b1b;
        }
        :global(.text-on-background) {
          color: #1c1b1b;
        }
        :global(.text-on-surface-variant) {
          color: #404848;
        }
        :global(.text-primary) {
          color: #002627;
        }
        :global(.text-primary-container) {
          color: #0f3d3e;
        }
        :global(.text-secondary) {
          color: #4b6547;
        }
        :global(.text-outline) {
          color: #717978;
        }
        :global(.text-on-secondary-container) {
          color: #516b4d;
        }

        :global(.border-outline) {
          border-color: #717978;
        }
        :global(.border-outline-variant) {
          border-color: #c0c8c8;
        }
        :global(.border-primary) {
          border-color: #002627;
        }
        :global(.border-primary\/5) {
          border-color: rgba(0, 38, 39, 0.05);
        }
        :global(.border-outline-variant\/20) {
          border-color: rgba(192, 200, 200, 0.2);
        }
        :global(.border-outline-variant\/30) {
          border-color: rgba(192, 200, 200, 0.3);
        }

        :global(.bg-primary\/5) {
          background-color: rgba(0, 38, 39, 0.05);
        }
        :global(.bg-secondary-container\/30) {
          background-color: rgba(205, 235, 197, 0.3);
        }
        :global(.bg-surface-container-low\/20) {
          background-color: rgba(246, 243, 242, 0.2);
        }
        :global(.text-primary\/60) {
          color: rgba(0, 38, 39, 0.6);
        }
        :global(.hover\:bg-primary:hover) {
          background-color: #002627;
        }
        :global(.hover\:text-primary:hover) {
          color: #002627;
        }
        :global(.hover\:text-white:hover) {
          color: #ffffff;
        }
        :global(.hover\:border-primary:hover) {
          border-color: #002627;
        }

        :global(.message-bubble) {
          border-radius: 32px;
        }
        :global(.message-bubble-incoming) {
          border-top-left-radius: 0;
        }
        :global(.message-bubble-outgoing) {
          border-top-right-radius: 0;
        }

      `}</style>
      <div className="bg-[#F7F7F5] text-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-4 w-full z-50 px-6">
        <div className="max-w-[1440px] mx-auto">
          <nav className="bg-white rounded-full px-8 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="text-xl font-extrabold tracking-tighter text-[#002627] leading-none">
                  GETYOURCAVE
                </div>
                <div className="text-[10px] font-bold tracking-[0.2em] text-[#002627]/60 mt-1 uppercase">
                  Space. Rent. Earn.
                </div>
              </div>
            </div>
            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">
                Home
              </a>
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">
                Browse Storage
              </a>
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">
                How it Works
              </a>
              {/* Mega Menu Trigger */}
              <div className="relative group">
                <button className="flex items-center gap-1 font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors py-4">
                  
                        For Owners
                        
                  <span className="material-symbols-outlined text-sm">
                    expand_more
                  </span>
                </button>
                {/* Mega Menu Container */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-[900px]">
                  <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 p-10 flex gap-12 text-left">
                    {/* Column 1 */}
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002627] mb-6">
                        List & Earn
                      </h4>
                      <div className="space-y-4">
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            deployed_code
                          </span>
                          <span className="text-sm font-medium">
                            Why List Your Space
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            monitoring
                          </span>
                          <span className="text-sm font-medium">
                            Earning Potential
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            star
                          </span>
                          <span className="text-sm font-medium">
                            Success Stories
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            add_box
                          </span>
                          <span className="text-sm font-medium">
                            Owner Benefits
                          </span>
                        </a>
                      </div>
                    </div>
                    {/* Column 2 */}
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002627] mb-6">
                        Resources
                      </h4>
                      <div className="space-y-4">
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            menu_book
                          </span>
                          <span className="text-sm font-medium">
                            Owner Guide
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            verified_user
                          </span>
                          <span className="text-sm font-medium">
                            Safety & Security
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            sell
                          </span>
                          <span className="text-sm font-medium">
                            Pricing & Fees
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            support_agent
                          </span>
                          <span className="text-sm font-medium">
                            Help Center
                          </span>
                        </a>
                      </div>
                    </div>
                    {/* Column 3 */}
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002627] mb-6">
                        Tools
                      </h4>
                      <div className="space-y-4">
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            dashboard
                          </span>
                          <span className="text-sm font-medium">
                            Dashboard Overview
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            payments
                          </span>
                          <span className="text-sm font-medium">
                            Payouts & Payments
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            description
                          </span>
                          <span className="text-sm font-medium">
                            Contracts & Docs
                          </span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">
                            task_alt
                          </span>
                          <span className="text-sm font-medium">
                            Verification Process
                          </span>
                        </a>
                      </div>
                    </div>
                    {/* Featured Card */}
                    <div className="w-72 bg-[#002627] rounded-[1.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
                      <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-3">
                          Become an Owner
                        </h4>
                        <p className="text-white/70 text-sm mb-6 leading-relaxed">
                          Turn your unused space into a steady income.
                        </p>
                      </div>
                      <button className="relative z-10 bg-[#CDEBC5] text-[#002627] px-6 py-3 rounded-full font-bold text-sm flex items-center justify-between group/btn hover:bg-white transition-colors">
                        
                                    List Your Space
                                    
                        <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </button>
                      {/* Background Decoration */}
                      <div className="absolute bottom-0 right-0 opacity-10 translate-y-1/4">
                        <svg fill="none" height="200" viewBox="0 0 200 200" width="200">
                          <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="0.5"></circle>
                          <circle cx="100" cy="100" r="70" stroke="white" strokeWidth="0.5"></circle>
                          <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="0.5"></circle>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">
                Pricing
              </a>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors">
                <span className="material-symbols-outlined text-xl">
                  person
                </span>
              </button>
              <button className="bg-[#002627] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#002627]/20">
                
                    List Your Space
                
              </button>
            </div>
          </nav>
        </div>
      </header>
      {/* Main Messaging Interface */}
      <main className="max-w-[1280px] mx-auto px-gutter mt-[140px]">
        <div className="flex h-[750px] bg-white rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] overflow-hidden">
          {/* Left Column: Conversations */}
          <aside className="w-1/3 border-r border-[#EBEBE8] flex flex-col bg-surface">
            <div className="h-20 px-lg flex items-center border-b border-[#EBEBE8] shrink-0">
              <h2 className="font-h2 text-h2 text-primary">
                Messages
              </h2>
            </div>
            <div className="px-lg pb-md">
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
          <section className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <header className="h-20 px-lg flex items-center justify-between border-b border-[#EBEBE8] shrink-0">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100">
                  <img className="w-full h-full object-cover" data-alt="Portrait of Julian, a storage space owner, in a high-end architectural setting with soft shadows and emerald green color touches. The style is premium and minimalist." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6C9w5Tqvfc-90F9fdaBHWaObKDwFDoXsXhzQ5pXeRgLhDB7p15rxNJ9eUWqcwncLUN0K-VwDPiSjZ5pX5ZQj2ow7MujHzGikGDfsRUSwQaEyjFR6BV4SRt1uTFTQmEnOOaDUHRBKorYf6mB4VONoBAMEwKniJ678K5i95jdPq-3x3Wdj65V0n5j_qzXLsxWKw-hIBbS5VqY9AKwrAwktcpBYdwR4J-pr7RZI910oKR7YoFXK9zOPBAf1QXrBC3nL6vprXmHB-CMQ" />
                </div>
                <div>
                  <h3 className="font-h3 text-body-md text-primary leading-tight">
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
              <button className="px-md py-2 border border-primary text-primary rounded-full font-label-caps hover:bg-stone-50 transition-all text-xs">
                
                        View Listing
                    
              </button>
            </header>
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg bg-[#FCF9F8]">
              {/* Incoming Message */}
              <div className="flex flex-col gap-sm max-w-[70%]">
                <div className="message-bubble message-bubble-incoming p-md bg-[#F2F0E9] text-body-md text-on-surface leading-relaxed">
                  
                            Hello! I saw your inquiry about the climate-controlled unit in West Chelsea. It's currently available and perfectly suited for fine art or vintage furniture.
                        
                </div>
                <span className="text-label-caps text-stone-400 px-sm">
                  12:30 PM
                </span>
              </div>
              {/* Outgoing Message */}
              <div className="flex flex-col gap-sm max-w-[70%] self-end items-end">
                <div className="message-bubble message-bubble-outgoing p-md bg-[#0F3D3E] text-white text-body-md leading-relaxed shadow-sm">
                  
                            That sounds perfect. I have three large oil paintings that need consistent humidity levels. What is the exact temperature range?
                        
                </div>
                <span className="text-label-caps text-stone-400 px-sm">
                  12:42 PM
                </span>
              </div>
              {/* Incoming Message */}
              <div className="flex flex-col gap-sm max-w-[70%]">
                <div className="message-bubble message-bubble-incoming p-md bg-[#F2F0E9] text-body-md text-on-surface leading-relaxed">
                  
                            The temperature control is set to a constant 21°C (70°F) with 50% relative humidity. We have secondary backup generators to ensure no fluctuations during power events.
                        
                </div>
                <span className="text-label-caps text-stone-400 px-sm">
                  12:45 PM
                </span>
              </div>
            </div>
            {/* Input Area */}
            <div className="border-t border-[#EBEBE8] bg-white p-xl">
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
      <footer className="bg-[#F2F0E9] w-full rounded-t-[48px] mt-20">
        <div className="flex flex-col md:flex-row justify-between items-start py-20 px-12 max-w-[1440px] mx-auto gap-12">
          <div className="max-w-xs">
            <div className="text-2xl font-bold text-[#0F3D3E] mb-4">
              GETYOURCAVE
            </div>
            <p className="font-manrope text-sm text-stone-600 mb-8 leading-relaxed">
              Architectural Serenity in Storage. Curating the world's most secure and beautiful private storage networks.
            </p>
            <div className="flex gap-4">
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">
                  share
                </span>
              </span>
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">
                  public
                </span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-widest">
                Platform
              </h5>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                Find Storage
              </a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                List Your Space
              </a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                How it works
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-widest">
                Trust
              </h5>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                Privacy
              </a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                Terms
              </a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                Host Guarantee
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-widest">
                Resources
              </h5>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                Support
              </a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                Safety
              </a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">
                Cookies
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-12 pb-12 border-t border-primary/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-manrope text-sm text-stone-600">
            © 2024 GETYOURCAVE. Architectural Serenity in Storage.
          </p>
          <p className="text-xs text-stone-400">
            Designed for the discerning minimalist.
          </p>
        </div>
      </footer>
      </div>
    </>
  );
}
