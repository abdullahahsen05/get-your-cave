
"use client";

export default function SignupPage() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        :global(*) { box-sizing: border-box; }
        :global(html) { scroll-behavior: smooth; }
        :global(body) {
          margin: 0;
          background: #fcf9f8;
          font-family: Manrope, sans-serif;
          color: #1c1b1b;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
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
          font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
        }

        :global(.font-body-md), :global(.font-body-sm), :global(.font-body-lg),
        :global(.font-h1), :global(.font-h2), :global(.font-h3), :global(.font-display),
        :global(.font-label-caps), :global(.font-italic-emphasis), :global(.font-manrope) {
          font-family: Manrope, sans-serif;
        }
        :global(.font-label-caps), :global(.text-label-caps) {
          font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600;
        }
        :global(.font-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.font-h2), :global(.text-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.font-h3), :global(.text-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.text-body-sm) { font-size: 14px; line-height: 1.5; }
        :global(.text-body-md) { font-size: 16px; line-height: 1.6; }
        :global(.text-body-lg) { font-size: 18px; line-height: 1.6; }
        :global(.italic-emphasis) { font-style: italic; }

        :global(.bg-background) { background-color: #fcf9f8; }
        :global(.bg-surface) { background-color: #fcf9f8; }
        :global(.bg-primary) { background-color: #002627; }
        :global(.bg-primary-container) { background-color: #0f3d3e; }
        :global(.bg-secondary) { background-color: #4b6547; }
        :global(.bg-secondary-container) { background-color: #cdebc5; }
        :global(.bg-surface-container) { background-color: #f0eded; }
        :global(.bg-surface-container-low) { background-color: #f6f3f2; }
        :global(.bg-surface-container-high) { background-color: #eae7e7; }
        :global(.bg-surface-container-lowest) { background-color: #fff; }
        :global(.bg-primary-fixed) { background-color: #beebeb; }

        :global(.text-primary) { color: #002627; }
        :global(.text-primary-container) { color: #0f3d3e; }
        :global(.text-secondary) { color: #4b6547; }
        :global(.text-secondary-container) { color: #cdebc5; }
        :global(.text-on-surface) { color: #1c1b1b; }
        :global(.text-on-surface-variant) { color: #404848; }
        :global(.text-on-secondary-container) { color: #516b4d; }
        :global(.text-on-primary) { color: #fff; }

        :global(.border-outline) { border-color: #717978; }
        :global(.border-outline-variant) { border-color: #c0c8c8; }
        :global(.border-primary) { border-color: #002627; }

        :global(.rounded-lg) { border-radius: 2rem; }
        :global(.rounded-xl) { border-radius: 3rem; }
        :global(.rounded-DEFAULT) { border-radius: 1rem; }

        :global(.gap-gutter), :global(.gap-lg) { gap: 24px; }
        :global(.gap-xl) { gap: 48px; }
        :global(.gap-md) { gap: 16px; }
        :global(.gap-sm) { gap: 8px; }
        :global(.gap-xs) { gap: 4px; }
        :global(.space-y-lg > :not([hidden]) ~ :not([hidden])) { margin-top: 24px; }
        :global(.space-y-md > :not([hidden]) ~ :not([hidden])) { margin-top: 16px; }
        :global(.space-y-sm > :not([hidden]) ~ :not([hidden])) { margin-top: 8px; }
        :global(.space-y-xs > :not([hidden]) ~ :not([hidden])) { margin-top: 4px; }

        :global(.p-lg) { padding: 24px; }
        :global(.p-xl) { padding: 48px; }
        :global(.p-xxl) { padding: 80px; }
        :global(.px-lg) { padding-left: 24px; padding-right: 24px; }
        :global(.px-xl) { padding-left: 48px; padding-right: 48px; }
        :global(.px-xxl) { padding-left: 80px; padding-right: 80px; }
        :global(.py-lg) { padding-top: 24px; padding-bottom: 24px; }
        :global(.py-xl) { padding-top: 48px; padding-bottom: 48px; }
        :global(.py-xxl) { padding-top: 80px; padding-bottom: 80px; }
        :global(.pr-lg) { padding-right: 24px; }
        :global(.pl-lg) { padding-left: 24px; }
        :global(.mb-xs) { margin-bottom: 4px; }
        :global(.mb-sm) { margin-bottom: 8px; }
        :global(.mb-md) { margin-bottom: 16px; }
        :global(.mb-lg) { margin-bottom: 24px; }
        :global(.mb-xl) { margin-bottom: 48px; }
        :global(.mt-lg) { margin-top: 24px; }
        :global(.mt-xl) { margin-top: 48px; }
        :global(.mt-xxl) { margin-top: 80px; }
        :global(.ml-sm) { margin-left: 8px; }

        :global(.bg-primary-container\/60) { background-color: rgba(15, 61, 62, 0.6); }
        :global(.bg-secondary-container\/20) { background-color: rgba(205, 235, 197, 0.2); }
        :global(.text-primary-container\/60) { color: rgba(15, 61, 62, 0.6); }
        :global(.text-white\/70) { color: rgba(255, 255, 255, 0.7); }
        :global(.text-white\/80) { color: rgba(255, 255, 255, 0.8); }
        :global(.border-white\/10) { border-color: rgba(255, 255, 255, 0.1); }
        :global(.shadow-\[0_20px_50px_rgba\(15\,61\,62\,0\.05\)\]) { box-shadow: 0 20px 50px rgba(15,61,62,0.05); }
        :global(.shadow-\[0_8px_30px_rgb\(0\,0\,0\,0\.04\)\]) { box-shadow: 0 8px 30px rgb(0,0,0,0.04); }
        :global(.shadow-\[0_20px_50px_rgba\(0\,0\,0\,0\.1\)\]) { box-shadow: 0 20px 50px rgba(0,0,0,0.1); }

        :global(.hover\:bg-primary:hover) { background-color: #002627; }
        :global(.hover\:bg-primary-container:hover) { background-color: #0f3d3e; }
        :global(.hover\:text-primary-container:hover) { color: #0f3d3e; }
        :global(.hover\:text-white:hover) { color: #fff; }
        :global(.hover\:text-\[\#002627\]:hover) { color: #002627; }
        :global(.group\/btn:hover .group-hover\/btn\:translate-x-1) { transform: translateX(0.25rem); }

        @media (min-width: 768px) {
          :global(.md\:p-xxl) { padding: 80px; }
        }

      `}</style>
      <div className="bg-background font-body-md text-on-surface antialiased flex flex-col min-h-screen">
        {/* Navbar from Admin Dashboard */}
        <header className="fixed top-4 w-full z-50 px-6">
          <div className="max-w-[1440px] mx-auto">
            <nav className="bg-white rounded-full px-8 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#002627]">
                    <span className="material-symbols-outlined text-white text-xl">
                      architecture
                    </span>
                  </div>
                  <div className="text-sm font-bold tracking-[0.2em] text-[#002627]">
                    GET YOUR CAVE
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
                    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 p-10 flex gap-12">
                      {/* Columns same as source */}
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
                        </div>
                      </div>
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
                        </div>
                      </div>
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
        <main className="flex-grow flex flex-col lg:flex-row pt-24 min-h-[calc(100vh-200px)]">
          {/* LEFT PANE: Split Content */}
          <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-primary-container">
            {/* Background Image */}
            <img alt="Secure high-end storage interior" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6JKCZg96XH_OcBwei1DFM6uy6aCmq2LZndtmXdjhEDG6Xy149HMG7vcWRZoQGuWSJaIWB3eXazNrplb1AJIS3RQ782xqjDZB54nfjvxf_jarCk-_YAYPHVI5KFgY_UwxuSjJUwa6SebsUANnQ-ysmUcRRzGAjcK5Ap1bOqxka-wByMgyZ204Mp7xP_vuDIPrCmJ-Jzcs2TM5nsvJUY_TVCzwaqNN0znNvT9AxRr4OIDpEjXnI-P86AosPyJwWDmVHCDBAKhxT6NQ" />
            {/* Overlay */}
            <div className="absolute inset-0 bg-primary-container/60 backdrop-blur-[2px]"></div>
            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center px-xxl text-white">
              <h2 className="text-[56px] font-bold leading-tight mb-md max-w-lg">
                Start your journey with secure storage
              </h2>
              <p className="text-white/80 text-body-lg mb-xl max-w-md">
                Join the most exclusive network of architectural storage spaces, curated for the discerning asset owner.
              </p>
              <div className="space-y-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-secondary-container">
                      verified_user
                    </span>
                  </div>
                  <span className="text-body-md font-semibold">
                    Verified Owners
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-secondary-container">
                      payments
                    </span>
                  </div>
                  <span className="text-body-md font-semibold">
                    Secure Payments
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-secondary-container">
                      contract
                    </span>
                  </div>
                  <span className="text-body-md font-semibold">
                    Easy Contracts
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT PANE: Signup Form */}
          <div className="flex-grow lg:w-1/2 flex items-center justify-center p-lg md:p-xxl bg-background">
            <div className="w-full max-w-[480px]">
              <div className="bg-white p-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(15,61,62,0.05)] border border-stone-100">
                <div className="text-center mb-xl">
                  <h3 className="text-h2 text-primary-container mb-xs">
                    Join GETYOURCAVE
                  </h3>
                  <p className="text-on-surface-variant text-body-sm">
                    Create your account to start listing or browsing storage.
                  </p>
                </div>
                <form className="space-y-lg">
                  <div className="space-y-xs">
                    <label className="text-label-caps text-stone-500 ml-sm">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary-container transition-colors">
                        mail
                      </span>
                      <input className="w-full pl-12 pr-lg py-4 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary-container/10 transition-all font-body-md text-on-surface placeholder:text-stone-300" placeholder="name@example.com" type="email" />
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <label className="text-label-caps text-stone-500 ml-sm">
                      Password
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary-container transition-colors">
                        lock
                      </span>
                      <input className="w-full pl-12 pr-14 py-4 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary-container/10 transition-all font-body-md text-on-surface placeholder:text-stone-300" placeholder="••••••••••••" type="password" />
                      <button className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary-container cursor-pointer transition-colors" type="button">
                        visibility
                      </button>
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <label className="text-label-caps text-stone-500 ml-sm">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary-container transition-colors">
                        lock
                      </span>
                      <input className="w-full pl-12 pr-lg py-4 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary-container/10 transition-all font-body-md text-on-surface placeholder:text-stone-300" placeholder="••••••••••••" type="password" />
                    </div>
                  </div>
                  <div className="pt-4 space-y-md">
                    <button className="w-full bg-[#0F3D3E] text-white py-4 rounded-full font-bold text-body-md shadow-lg shadow-[#0F3D3E]/10 transition-transform active:scale-[0.98] duration-200" type="submit">
                      
                                Create Account
                            
                    </button>
                    <div className="relative flex items-center justify-center py-2">
                      <div className="w-full border-t border-stone-100"></div>
                      <span className="absolute bg-white px-md text-label-caps text-stone-300">
                        OR
                      </span>
                    </div>
                    <button className="w-full flex items-center justify-center gap-3 border border-stone-200 py-4 rounded-full font-semibold text-primary-container bg-white hover:bg-stone-50 transition-all active:scale-[0.98] duration-200" type="button">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                      </svg>
                      
                                Continue with Google
                            
                    </button>
                  </div>
                </form>
                <div className="mt-xl text-center">
                  <p className="text-body-sm text-on-surface-variant">
                    
                            Already have an account? 
                            
                    <a className="text-primary-container font-bold hover:underline underline-offset-4 decoration-2" href="#">
                      Log in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        {/* Footer from Admin Dashboard */}
        <footer className="bg-[#F2F0E9] w-full rounded-t-[48px]">
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
