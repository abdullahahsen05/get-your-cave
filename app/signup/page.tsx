export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface antialiased flex items-center justify-center pt-32 pb-12 px-6">
      <div className="w-full max-w-[1150px] bg-[#F7F7F5] rounded-[24px] shadow-[0_8px_40px_rgba(15,61,62,0.06)] overflow-hidden border border-[#EBEBE8]">
        <section className="w-full bg-[#F2F0E9] border-b border-[#EBEBE8] px-8 pt-6 pb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-3">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 opacity-100">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  info
                </span>
                <span className="text-label-caps text-primary">Account</span>
              </div>

              <div className="flex items-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  person
                </span>
                <span className="text-label-caps text-primary">Profile</span>
              </div>

              <div className="flex items-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  description
                </span>
                <span className="text-label-caps text-primary">Verify</span>
              </div>

              <div className="flex items-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  check_circle
                </span>
                <span className="text-label-caps text-primary">Finish</span>
              </div>
            </div>

            <span className="text-label-caps text-on-tertiary-fixed-variant">
              Step 1 of 4
            </span>
          </div>

          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary transition-all duration-500 w-1/4" />
          </div>
        </section>

        <div className="flex flex-col md:flex-row min-h-[600px]">
          <aside className="w-full md:w-[40%] bg-secondary-container/30 relative p-8 md:p-12 flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-10 grayscale pointer-events-none">
              <img
                alt="A clean, professionally organized high-end storage facility with architectural lighting and polished concrete floors."
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuABaZjB_-aytvUuKveqUINV1YI1WXjyMSJ3dYyiCqOq_D4utxkOrqErgjJmQKWQXrc4IIDv-6PR_mAEE-uZgPAQyHaFlzBj3Aoclm38lS9n9RboAo3gEU6cdOwMw9uUM966NJbfem2kElH7gebXA9hq5WM940SYJ-ewFe1YDSSTzMkbT_cfYWDtTTUy6sfzAyur0zhmOY8nrhc_qtFpHM6WndltIV-bL4_zl5aB9vlEk81-EQLJ2vRh10uqB2QnZ1AZgcZ4E_wnL7U"
              />
            </div>

            <div className="relative z-10">
              <h1 className="font-h2 text-h2 text-primary mb-12">
                Earn from your unused space
              </h1>

              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-on-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary">
                      verified
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-body-md">
                      Verified Owners
                    </p>
                    <p className="text-stone-500 text-body-sm">
                      Trust-first community protocols.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-on-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary">
                      payments
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-body-md">
                      Secure Payments
                    </p>
                    <p className="text-stone-500 text-body-sm">
                      Automated monthly distributions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-on-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary">
                      description
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-body-md">
                      Easy Contracts
                    </p>
                    <p className="text-stone-500 text-body-sm">
                      Legally binding, simple terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8">
              <p className="text-xs text-secondary italic opacity-75">
                Join 5,000+ hosts securing assets globally.
              </p>
            </div>
          </aside>

          <section className="w-full md:w-[60%] p-8 md:p-12 flex flex-col justify-between">
            <div className="max-w-[480px] mx-auto w-full">
              <form className="space-y-6">
                <section>
                  <div className="mb-10">
                    <h3 className="font-h1 text-h1 text-primary mb-2">
                      Join the Collective
                    </h3>
                    <p className="font-body-md text-body-md text-stone-500">
                      Secure your assets in the world&apos;s most architectural
                      caves.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label
                        className="font-label-caps text-label-caps text-on-tertiary-fixed-variant ml-1"
                        htmlFor="email"
                      >
                        EMAIL ADDRESS
                      </label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        id="email"
                        placeholder="name@luxury.com"
                        type="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="font-label-caps text-label-caps text-on-tertiary-fixed-variant ml-1"
                        htmlFor="password"
                      >
                        PASSWORD
                      </label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        id="password"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="font-label-caps text-label-caps text-on-tertiary-fixed-variant ml-1"
                        htmlFor="confirm-password"
                      >
                        CONFIRM PASSWORD
                      </label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        id="confirm-password"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-[#EBEBE8]" />
                      <span className="flex-shrink mx-4 text-stone-400 font-label-caps text-[10px]">
                        OR CONTINUE WITH
                      </span>
                      <div className="flex-grow border-t border-[#EBEBE8]" />
                    </div>

                    <button
                      className="w-full bg-transparent border border-stone-300 text-primary py-4 rounded-full font-bold text-body-md flex items-center justify-center gap-3 hover:bg-stone-50 active:scale-[0.98] transition-all"
                      type="button"
                    >
                      <img
                        alt="Google Logo"
                        className="w-5 h-5"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdEhsntc5vjig4w7WeMCyVcxWJRhdfs8cA1tzBPR-yD02LbeRo4LNKwd5__u5oOd-dOufYAluR4AiON_W3fBKoWUYtByIF26S06tbeVzKLBvFRietmTamoueAsw57ysu57iUiZxNoRSn7UYCtGhWpubYdVs7xED1jDdXfPrPvt74enUUPjkDRDZfyXXinK1QzEKyZcipaYxb4nhRx1Nli7s-TO_ngZbQfxMluvyUoXaSVDZoHMU0ah7AzVYUxmIpkQsLdx8D07Z7Q"
                      />
                      Continue with Google
                    </button>
                  </div>
                </section>

                <div className="pt-8 flex items-center justify-between gap-4">
                  <button
                    className="px-8 py-3 rounded-full text-primary font-bold text-sm hover:bg-stone-100 transition-colors flex items-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      arrow_back
                    </span>
                    Back
                  </button>

                  <button
                    className="bg-[#0F3D3E] text-on-primary px-10 py-4 rounded-full font-bold text-body-md hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center gap-2"
                    type="button"
                  >
                    Next Step
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-10 text-center">
                <p className="text-body-sm text-stone-500">
                  Already have an account?{' '}
                  <a
                    className="text-[#0F3D3E] font-bold hover:underline decoration-[#A7C4A0] underline-offset-4"
                    href="#"
                  >
                    Log in
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
