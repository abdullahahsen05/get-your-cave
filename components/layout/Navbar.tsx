import Link from "next/link";

import { getCurrentUser, getDashboardPath } from "@/lib/auth";

export default async function Navbar() {
  const currentUser = await getCurrentUser();
  const dashboardPath = currentUser ? getDashboardPath(currentUser.role) : "/login";

  return (
    <header className="fixed top-4 w-full z-50 px-6">
      <div className="max-w-[1440px] mx-auto">
        <nav className="bg-white rounded-full px-8 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 origin-top scale-[0.85]">
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

          <div className="hidden lg:flex items-center gap-8">
            <Link
              className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors"
              href="/"
            >
              Home
            </Link>
            <Link
              className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors"
              href="/storage"
            >
              Browse Storage
            </Link>
            <a
              className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors"
              href="#"
            >
              How it Works
            </a>
            <div className="relative group">
              <button className="flex items-center gap-1 font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors py-4">
                For Owners
                <span className="material-symbols-outlined text-sm">
                  expand_more
                </span>
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-[900px]">
                <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 p-10 flex gap-12">
                  <div className="flex-1">
                    <h4 className="font-bold text-[#002627] mb-6">
                      List &amp; Earn
                    </h4>
                    <div className="space-y-4">
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          deployed_code
                        </span>
                        <span className="text-sm font-medium">
                          Why List Your Space
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          monitoring
                        </span>
                        <span className="text-sm font-medium">
                          Earning Potential
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          star
                        </span>
                        <span className="text-sm font-medium">
                          Success Stories
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          add_box
                        </span>
                        <span className="text-sm font-medium">
                          Owner Benefits
                        </span>
                      </a>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#002627] mb-6">Resources</h4>
                    <div className="space-y-4">
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          menu_book
                        </span>
                        <span className="text-sm font-medium">Owner Guide</span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          verified_user
                        </span>
                        <span className="text-sm font-medium">
                          Safety &amp; Security
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          sell
                        </span>
                        <span className="text-sm font-medium">
                          Pricing &amp; Fees
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          support_agent
                        </span>
                        <span className="text-sm font-medium">Help Center</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#002627] mb-6">Tools</h4>
                    <div className="space-y-4">
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          dashboard
                        </span>
                        <span className="text-sm font-medium">
                          Dashboard Overview
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          payments
                        </span>
                        <span className="text-sm font-medium">
                          Payouts &amp; Payments
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          description
                        </span>
                        <span className="text-sm font-medium">
                          Contracts &amp; Docs
                        </span>
                      </a>
                      <a
                        className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-stone-400">
                          task_alt
                        </span>
                        <span className="text-sm font-medium">
                          Verification Process
                        </span>
                      </a>
                    </div>
                  </div>
                  <div className="w-72 bg-[#002627] rounded-[1.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10">
                      <h4 className="text-xl font-bold mb-3">
                        Become an Owner
                      </h4>
                      <p className="text-white/70 text-sm mb-6 leading-relaxed">
                        Turn your unused space into a steady income.
                      </p>
                    </div>
                    <Link
                      className="relative z-10 bg-[#CDEBC5] text-[#002627] px-6 py-3 rounded-full font-bold text-sm flex items-center justify-between group/btn hover:bg-white transition-colors"
                      href="/signup"
                    >
                      List Your Space
                      <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                    <div className="absolute bottom-0 right-0 opacity-10 translate-y-1/4">
                      <svg fill="none" height="200" viewBox="0 0 200 200" width="200">
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          stroke="white"
                          strokeWidth="0.5"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="70"
                          stroke="white"
                          strokeWidth="0.5"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="50"
                          stroke="white"
                          strokeWidth="0.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <a
              className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors"
              href="#"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <form action="/api/auth/logout" method="post">
                  <button
                    aria-label="Sign out"
                    className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-xl">
                      logout
                    </span>
                  </button>
                </form>
                <Link
                  className="bg-[#002627] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#002627]/20"
                  href={dashboardPath}
                >
                  {currentUser.role === "ADMIN"
                    ? "Admin Dashboard"
                    : currentUser.role === "OWNER"
                      ? "Owner Dashboard"
                      : "Renter Dashboard"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  aria-label="Log in"
                  className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                  href="/login"
                >
                  <span className="material-symbols-outlined text-xl">
                    person
                  </span>
                </Link>
                <Link
                  className="bg-[#002627] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#002627]/20"
                  href="/signup"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

