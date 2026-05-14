
"use client";

export default function SignupPage() {
  return (
      <div className="bg-background font-body-md text-on-surface antialiased flex flex-col min-h-screen">
        {/* Navbar from Admin Dashboard */}
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
              </div>
  );
}

