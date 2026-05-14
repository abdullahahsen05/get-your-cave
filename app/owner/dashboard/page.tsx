

"use client";

export default function OwnerDashboardPageStyledFixed() {
  return (
    <div className={"min-h-screen bg-background text-on-surface"}>
      <main className={'max-w-7xl mx-auto px-6 py-12 space-y-12 mt-18'}>
        <div className={'space-y-2'}>
          <p className={'text-label-caps font-label-caps text-secondary tracking-widest'}>
            OWNER DASHBOARD
          </p>
          <h1 className={'text-h1 font-h1 text-primary'}>
            Welcome back Julian (Owner)
          </h1>
        </div>
        <div className={'grid grid-cols-1 md:grid-cols-3 gap-lg'}>
          <div className={'bg-surface-container-low p-xl rounded-lg border border-outline-variant/30 flex flex-col gap-2'}>
            <span className={'text-label-caps font-label-caps text-on-surface-variant'}>
              TOTAL EARNINGS
            </span>
            <span className={'text-display font-display text-primary'}>
              $4,280
            </span>
            <div className={'flex items-center gap-1 text-secondary mt-2'}>
              <span className={'material-symbols-outlined text-sm'}>
                trending_up
              </span>
              <span className={'text-body-sm font-body-sm'}>
                +12% from last month
              </span>
            </div>
          </div>
          <div className={'bg-surface-container-low p-xl rounded-lg border border-outline-variant/30 flex flex-col gap-2'}>
            <span className={'text-label-caps font-label-caps text-on-surface-variant'}>
              ACTIVE LISTINGS
            </span>
            <span className={'text-display font-display text-primary'}>
              3
            </span>
            <span className={'text-body-sm font-body-sm text-on-surface-variant mt-2'}>
              All units currently occupied
            </span>
          </div>
          <div className={'bg-surface-container-low p-xl rounded-lg border border-outline-variant/30 flex flex-col gap-2'}>
            <span className={'text-label-caps font-label-caps text-on-surface-variant'}>
              TENANT ACTIVITY
            </span>
            <span className={'text-display font-display text-primary'}>
              2
            </span>
            <div className={'flex items-center gap-1 text-primary-container mt-2'}>
              <span className={'material-symbols-outlined text-sm'}>
                mail
              </span>
              <span className={'text-body-sm font-body-sm'}>
                New messages pending
              </span>
            </div>
          </div>
        </div>
        <section className={'bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden'}>
          <div className={'px-xl pt-xl flex justify-between items-end'}>
            <div>
              <h2 className={'text-h3 font-h3 text-primary'}>
                Revenue Overview
              </h2>
              <p className={'text-body-sm font-body-sm text-on-surface-variant'}>
                Last 6 months performance
              </p>
            </div>
            <div className={'flex gap-4'}>
              <div className={'flex items-center gap-2'}>
                <span className={'w-3 h-3 rounded-full bg-primary-container'}></span>
                <span className={'text-label-caps font-label-caps text-on-surface-variant'}>
                  GROSS REVENUE
                </span>
              </div>
            </div>
          </div>
          <div className={'h-64 mt-8 relative px-xl'}>
            <svg className={'w-full h-full preserve-3d'} preserveAspectRatio={'none'} viewBox={'0 0 1000 200'}>
              <defs>
                <linearGradient id={'chartGradient'} x1={'0'} x2={'0'} y1={'0'} y2={'1'}>
                  <stop offset={'0%'} stopColor={'#0F3D3E'} stopOpacity={'0.1'}></stop>
                  <stop offset={'100%'} stopColor={'#0F3D3E'} stopOpacity={'0'}></stop>
                </linearGradient>
              </defs>
              <path d={'M0 180 Q 150 150, 300 160 T 600 100 T 1000 40 L 1000 200 L 0 200 Z'} fill={'url(#chartGradient)'}></path>
              <path d={'M0 180 Q 150 150, 300 160 T 600 100 T 1000 40'} fill={'none'} stroke={'#0F3D3E'} strokeLinecap={'round'} strokeWidth={'3'}></path>
            </svg>
            <div className={'flex justify-between text-label-caps font-label-caps text-on-surface-variant mt-4 opacity-60'}>
              <span>
                JAN
              </span>
              <span>
                FEB
              </span>
              <span>
                MAR
              </span>
              <span>
                APR
              </span>
              <span>
                MAY
              </span>
              <span>
                JUN
              </span>
            </div>
          </div>
        </section>
        <div className={'grid grid-cols-1 lg:grid-cols-3 gap-xl'}>
          <div className={'lg:col-span-2 space-y-lg'}>
            <div className={'flex items-center justify-between'}>
              <h2 className={'text-h2 font-h2 text-primary'}>
                Your Listings
              </h2>
              <button className={'bg-primary text-on-primary rounded-full px-6 py-2 text-body-sm font-medium hover:opacity-90 transition-opacity'}>
                Add New Cave
              </button>
            </div>
            <div className={'grid grid-cols-1 md:grid-cols-2 gap-lg'}>
              <div className={'group bg-white rounded-lg overflow-hidden border border-outline-variant/20 hover:shadow-[0_4px_20px_rgba(15,61,62,0.04)] transition-all'}>
                <div className={'aspect-video w-full overflow-hidden relative'}>
                  <img className={'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'} data-alt={'A high-end, minimalist industrial studio space in West Chelsea with polished concrete floors and dramatic architectural lighting. The scene is bathed in a calm, cool-toned daylight that emphasizes the clean lines and spaciousness of the storage vault. The atmosphere is professional and secure, using a palette of slate greys and forest greens consistent with a luxury asset protection brand.'} src={'https://lh3.googleusercontent.com/aida-public/AB6AXuBhnrtJ57vRKyPKnJ6oLkdjsp6Tu_-Fac1QsViHGr7BL6TzplQO6joQiIK7i_sLWQSwaZd6_KgaVuGSRKCA2skyJamejpIc0EDOc-xg4MnGTmLLWyE6NyxzzqD-8qs2GWXwxtCMcHgzlpaiQqMyvrzreOdFHzZONt0V9jFDrjbaGDwYkskZxVm5b0NwhnYVSwMuH6I-mw1q9wlBzTk692BeCH5m0XHr2boBicvEchpnen5GA-VpZczZoeiGnjVfO9YBDilppi3Z2M8'} />
                  <span className={'absolute top-4 right-4 bg-secondary-container text-on-secondary-fixed text-label-caps font-label-caps px-3 py-1 rounded-full'}>
                    OCCUPIED
                  </span>
                </div>
                <div className={'p-lg space-y-4'}>
                  <div>
                    <h3 className={'text-h3 font-h3 text-primary'}>
                      West Chelsea Studio
                    </h3>
                    <p className={'text-body-sm font-body-sm text-on-surface-variant'}>
                      Climate Controlled • 200 sq ft
                    </p>
                  </div>
                  <div className={'flex justify-between items-end border-t border-outline-variant/10 pt-4'}>
                    <div className={'flex flex-col'}>
                      <span className={'text-label-caps font-label-caps text-on-surface-variant'}>
                        MONTHLY REVENUE
                      </span>
                      <span className={'text-h3 font-h3 text-primary'}>
                        $1,850
                      </span>
                    </div>
                    <button className={'text-primary-container font-semibold flex items-center gap-1 group/btn'}>
                      <span className={'text-body-sm font-body-sm'}>
                        Manage
                      </span>
                      <span className={'material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform'}>
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className={'group bg-white rounded-lg overflow-hidden border border-outline-variant/20 hover:shadow-[0_4px_20px_rgba(15,61,62,0.04)] transition-all'}>
                <div className={'aspect-video w-full overflow-hidden relative'}>
                  <img className={'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'} data-alt={'A luxury underground vault space in Tribeca with warm oak wood paneling and soft, recessed gallery lighting. The image captures an atmosphere of ultimate security and serenity, highlighting the premium architectural finish. The lighting creates a welcoming yet exclusive mood, perfectly aligned with high-value storage and asset protection services for discerning clients.'} src={'https://lh3.googleusercontent.com/aida-public/AB6AXuAPSbjfT9vcpv7TudTmagWwoCQiD3wU2U5bXiWaswxlVjs2-mIPMtTsnFHjown1Mi6bcMH22RYFClgUvEyrA01ezGeG8RJPl-Si_wUSIfB3QhCENaU195KcOGNkVQexe-tBqfVQ6gdxjQfN2I7zUDE2-NYZ5ShyOCQAy2n53glD52UHZorJNUAT00nQjti7PcLZquWqK8naw4TzCl3WdFszcrtMwYW0netXzY-bQVVJ8Dd53TEmQxAZQJ60gLPX7vCj1t3-xWqMDFw'} />
                  <span className={'absolute top-4 right-4 bg-secondary-container text-on-secondary-fixed text-label-caps font-label-caps px-3 py-1 rounded-full'}>
                    OCCUPIED
                  </span>
                </div>
                <div className={'p-lg space-y-4'}>
                  <div>
                    <h3 className={'text-h3 font-h3 text-primary'}>
                      Tribeca Vault
                    </h3>
                    <p className={'text-body-sm font-body-sm text-on-surface-variant'}>
                      High Security • 150 sq ft
                    </p>
                  </div>
                  <div className={'flex justify-between items-end border-t border-outline-variant/10 pt-4'}>
                    <div className={'flex flex-col'}>
                      <span className={'text-label-caps font-label-caps text-on-surface-variant'}>
                        MONTHLY REVENUE
                      </span>
                      <span className={'text-h3 font-h3 text-primary'}>
                        $2,430
                      </span>
                    </div>
                    <button className={'text-primary-container font-semibold flex items-center gap-1 group/btn'}>
                      <span className={'text-body-sm font-body-sm'}>
                        Manage
                      </span>
                      <span className={'material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform'}>
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <aside className={'space-y-lg'}>
            <h2 className={'text-h2 font-h2 text-primary'}>
              Recent Activity
            </h2>
            <div className={'bg-surface-container-low rounded-lg p-lg space-y-6 border border-outline-variant/30'}>
              <div className={'flex gap-4 items-start'}>
                <div className={'w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0'}>
                  <span className={'material-symbols-outlined text-on-secondary-fixed text-md'}>
                    event_available
                  </span>
                </div>
                <div className={'space-y-1'}>
                  <p className={'text-body-sm font-body-sm text-on-surface'}>
                    <span className={'font-bold'}>
                      Sarah M.
                    </span>
                     booked 
                    <span className={'font-bold'}>
                      West Chelsea Studio
                    </span>
                  </p>
                  <p className={'text-label-caps font-label-caps text-on-surface-variant'}>
                    2 HOURS AGO
                  </p>
                </div>
              </div>
              <div className={'flex gap-4 items-start'}>
                <div className={'w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center flex-shrink-0'}>
                  <span className={'material-symbols-outlined text-on-tertiary-fixed text-md'}>
                    mail
                  </span>
                </div>
                <div className={'space-y-1'}>
                  <p className={'text-body-sm font-body-sm text-on-surface'}>
                    Message from 
                    <span className={'font-bold'}>
                      David K.
                    </span>
                     regarding Tribeca accessibility
                  </p>
                  <p className={'text-label-caps font-label-caps text-on-surface-variant'}>
                    5 HOURS AGO
                  </p>
                </div>
              </div>
              <div className={'flex gap-4 items-start'}>
                <div className={'w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0'}>
                  <span className={'material-symbols-outlined text-on-primary-fixed text-md'}>
                    payments
                  </span>
                </div>
                <div className={'space-y-1'}>
                  <p className={'text-body-sm font-body-sm text-on-surface'}>
                    Payout of 
                    <span className={'font-bold'}>
                      $1,250
                    </span>
                     initiated to bank account
                  </p>
                  <p className={'text-label-caps font-label-caps text-on-surface-variant'}>
                    YESTERDAY
                  </p>
                </div>
              </div>
              <div className={'flex gap-4 items-start'}>
                <div className={'w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0'}>
                  <span className={'material-symbols-outlined text-on-secondary-fixed text-md'}>
                    reviews
                  </span>
                </div>
                <div className={'space-y-1'}>
                  <p className={'text-body-sm font-body-sm text-on-surface'}>
                    <span className={'font-bold'}>
                      Leo T.
                    </span>
                     left a 5-star review for Midtown Locker
                  </p>
                  <p className={'text-label-caps font-label-caps text-on-surface-variant'}>
                    2 DAYS AGO
                  </p>
                </div>
              </div>
              <button className={'w-full text-center py-2 border border-outline-variant/30 rounded-full text-body-sm font-medium text-primary hover:bg-surface-container transition-colors'}>
                View All Activity
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
