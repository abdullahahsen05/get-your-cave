"use client";

export default function RenterDashboardPageDittoStyled() {
  return (
    <>
      <style jsx global>{`

        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        :global(html) { scroll-behavior: smooth; }
        :global(*) { box-sizing: border-box; }
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
          font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
        }
        :global(.active-nav-border) { border-bottom: 2px solid #0f3d3e; }

        /* Original Tailwind theme token utilities recreated for project-level scalability */
        :global(.font-manrope),
        :global(.font-body-sm),
        :global(.font-body-md),
        :global(.font-body-lg),
        :global(.font-display),
        :global(.font-h1),
        :global(.font-h2),
        :global(.font-h3),
        :global(.font-label-caps),
        :global(.font-italic-emphasis) { font-family: Manrope, sans-serif; }

        :global(.font-display) { font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 800; }
        :global(.font-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.font-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.font-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.font-body-md) { font-size: 16px; line-height: 1.6; font-weight: 400; }
        :global(.font-body-sm) { font-size: 14px; line-height: 1.5; font-weight: 400; }
        :global(.font-body-lg) { font-size: 18px; line-height: 1.6; font-weight: 400; }
        :global(.font-label-caps) { font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600; }

        :global(.text-display) { font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 800; }
        :global(.text-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.text-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.text-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.text-body-lg) { font-size: 18px; line-height: 1.6; }
        :global(.text-body-md) { font-size: 16px; line-height: 1.6; }
        :global(.text-body-sm) { font-size: 14px; line-height: 1.5; }
        :global(.text-label-caps) { font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600; }

        :global(.bg-background) { background-color: #fcf9f8; }
        :global(.bg-surface) { background-color: #fcf9f8; }
        :global(.bg-surface-container) { background-color: #f0eded; }
        :global(.bg-surface-container-low) { background-color: #f6f3f2; }
        :global(.bg-surface-container-lowest) { background-color: #ffffff; }
        :global(.bg-surface-container-high) { background-color: #eae7e7; }
        :global(.bg-surface-variant) { background-color: #e5e2e1; }
        :global(.bg-primary) { background-color: #002627; }
        :global(.bg-primary-container) { background-color: #0f3d3e; }
        :global(.bg-primary-fixed) { background-color: #beebeb; }
        :global(.bg-secondary) { background-color: #4b6547; }
        :global(.bg-secondary-container) { background-color: #cdebc5; }
        :global(.bg-secondary-fixed-dim) { background-color: #b1cfaa; }

        :global(.text-primary) { color: #002627; }
        :global(.text-primary-container) { color: #0f3d3e; }
        :global(.text-on-primary) { color: #ffffff; }
        :global(.text-on-surface) { color: #1c1b1b; }
        :global(.text-on-background) { color: #1c1b1b; }
        :global(.text-on-surface-variant) { color: #404848; }
        :global(.text-outline) { color: #717978; }
        :global(.text-secondary) { color: #4b6547; }
        :global(.text-on-secondary-fixed) { color: #092009; }
        :global(.text-on-secondary-container) { color: #516b4d; }

        :global(.border-outline) { border-color: #717978; }
        :global(.border-outline-variant) { border-color: #c0c8c8; }
        :global(.border-primary) { border-color: #002627; }
        :global(.border-primary\/5) { border-color: rgba(0, 38, 39, 0.05); }
        :global(.border-outline-variant\/20) { border-color: rgba(192, 200, 200, 0.2); }
        :global(.border-outline-variant\/30) { border-color: rgba(192, 200, 200, 0.3); }
        :global(.border-\[\#EBEBE8\]) { border-color: #ebebe8; }

        :global(.bg-primary\/5) { background-color: rgba(0, 38, 39, 0.05); }
        :global(.bg-\[\#F2F0E9\]) { background-color: #f2f0e9; }
        :global(.bg-\[\#002627\]) { background-color: #002627; }
        :global(.bg-\[\#CDEBC5\]) { background-color: #cdebc5; }
        :global(.bg-\[\#0F3D3E\]) { background-color: #0f3d3e; }
        :global(.text-\[\#002627\]) { color: #002627; }
        :global(.text-\[\#002627\]\/60) { color: rgba(0, 38, 39, 0.6); }
        :global(.text-\[\#0F3D3E\]) { color: #0f3d3e; }
        :global(.text-\[\#092009\]) { color: #092009; }
        :global(.hover\:text-\[\#002627\]:hover) { color: #002627; }
        :global(.hover\:text-\[\#002627\]\/70:hover) { color: rgba(0, 38, 39, 0.7); }
        :global(.hover\:text-\[\#0F3D3E\]:hover) { color: #0f3d3e; }

        :global(.rounded-lg) { border-radius: 2rem; }
        :global(.rounded-xl) { border-radius: 3rem; }
        :global(.gap-gutter) { gap: 24px; }
        :global(.gap-lg) { gap: 24px; }
        :global(.gap-md) { gap: 16px; }
        :global(.p-lg) { padding: 24px; }
        :global(.p-xl) { padding: 48px; }
        :global(.px-lg) { padding-left: 24px; padding-right: 24px; }
        :global(.py-lg) { padding-top: 24px; padding-bottom: 24px; }
        :global(.px-xl) { padding-left: 48px; padding-right: 48px; }
        :global(.py-xl) { padding-top: 48px; padding-bottom: 48px; }
        :global(.pt-xl) { padding-top: 48px; }
        :global(.pb-xl) { padding-bottom: 48px; }
        :global(.mb-xl) { margin-bottom: 48px; }
        :global(.mt-xl) { margin-top: 48px; }
        :global(.mt-xxl) { margin-top: 80px; }

        :global(.hover\:bg-primary:hover) { background-color: #002627; }
        :global(.hover\:bg-surface-container:hover) { background-color: #f0eded; }
        :global(.hover\:text-white:hover) { color: #ffffff; }
        :global(.selection\:bg-primary-fixed ::selection),
        :global(.selection\:bg-primary-fixed::selection) { background-color: #beebeb; }

      `}</style>
      <div className="bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed antialiased">
      {/* Floating Header from SCREEN_2 */}
      <header className="fixed top-4 w-full z-50 px-6">
        <div className="max-w-[1440px] mx-auto">
          <nav className="bg-white rounded-full px-8 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="text-xl font-extrabold tracking-tighter text-[#002627] leading-none">GETYOURCAVE</div>
                <div className="text-[10px] font-bold tracking-[0.2em] text-[#002627]/60 mt-1 uppercase">Space. Rent. Earn.</div>
              </div>
            </div>
            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">Home</a>
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">Browse Storage</a>
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">How it Works</a>
              {/* Mega Menu Trigger */}
              <div className="relative group">
                <button className="flex items-center gap-1 font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors py-4">
                  
                        For Owners
                        
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
                {/* Mega Menu Container */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-[900px]">
                  <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 p-10 flex gap-12 text-left">
                    {/* Column 1 */}
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002627] mb-6">List & Earn</h4>
                      <div className="space-y-4">
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">deployed_code</span>
                          <span className="text-sm font-medium">Why List Your Space</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">monitoring</span>
                          <span className="text-sm font-medium">Earning Potential</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">star</span>
                          <span className="text-sm font-medium">Success Stories</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">add_box</span>
                          <span className="text-sm font-medium">Owner Benefits</span>
                        </a>
                      </div>
                    </div>
                    {/* Column 2 */}
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002627] mb-6">Resources</h4>
                      <div className="space-y-4">
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">menu_book</span>
                          <span className="text-sm font-medium">Owner Guide</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">verified_user</span>
                          <span className="text-sm font-medium">Safety & Security</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">sell</span>
                          <span className="text-sm font-medium">Pricing & Fees</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">support_agent</span>
                          <span className="text-sm font-medium">Help Center</span>
                        </a>
                      </div>
                    </div>
                    {/* Column 3 */}
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002627] mb-6">Tools</h4>
                      <div className="space-y-4">
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">dashboard</span>
                          <span className="text-sm font-medium">Dashboard Overview</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">payments</span>
                          <span className="text-sm font-medium">Payouts & Payments</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">description</span>
                          <span className="text-sm font-medium">Contracts & Docs</span>
                        </a>
                        <a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
                          <span className="material-symbols-outlined text-stone-400">task_alt</span>
                          <span className="text-sm font-medium">Verification Process</span>
                        </a>
                      </div>
                    </div>
                    {/* Featured Card */}
                    <div className="w-72 bg-[#002627] rounded-[1.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
                      <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-3">Become an Owner</h4>
                        <p className="text-white/70 text-sm mb-6 leading-relaxed">Turn your unused space into a steady income.</p>
                      </div>
                      <button className="relative z-10 bg-[#CDEBC5] text-[#002627] px-6 py-3 rounded-full font-bold text-sm flex items-center justify-between group/btn hover:bg-white transition-colors">
                        
                                    List Your Space
                                    
                        <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
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
              <a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">Pricing</a>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"><span className="material-symbols-outlined text-xl">person</span></button>
              <button className="bg-[#002627] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#002627]/20">
                
                    List Your Space
                
              </button>
            </div>
          </nav>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-8 pt-32 pb-24 overflow-y-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-h1 text-h1 text-primary mb-2">Welcome back Julian</h1>
          <p className="font-body-md text-body-md text-outline">You have 2 active rentals and 1 message waiting for your response.</p>
        </header>
        {/* Quick Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">Active Units</p>
            <p className="font-h2 text-h2 text-primary">2</p>
            <div className="mt-4 w-full bg-surface-container h-1.5 rounded-full"><div className="bg-secondary-fixed-dim h-full rounded-full" style={{width: "66%"}}></div></div>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">Next Payment</p>
            <p className="font-h2 text-h2 text-primary">Oct 15</p>
            <p className="text-body-sm font-body-sm text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" data-icon="event">event</span>
              
                Auto-pay enabled
            
            </p>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">Total Saved</p>
            <p className="font-h2 text-h2 text-primary">120 sq ft</p>
            <p className="text-body-sm font-body-sm text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" data-icon="check_circle">check_circle</span>
              
                Verified capacity
            
            </p>
          </div>
        </section>
        {/* Active Rentals */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="font-h2 text-h2 text-primary">Active Rentals</h2>
            <a className="text-body-sm font-body-sm text-primary font-bold hover:underline underline-offset-4" href="#">View All</a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rental Card 1 */}
            <article className="group bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] transition-all hover:translate-y-[-4px]">
              <div className="h-64 relative overflow-hidden">
                <img alt="The Heights Private Cave" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A modern, high-end private storage interior with sleek concrete floors and minimalist white paneling. The lighting is diffused and professional, emphasizing cleanliness and architectural serenity. No clutter is visible, reflecting a premium storage solution with a palette of soft greys and cool whites, creating a sense of secure and spacious abundance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWM-9MgAPyfeNpm1vYVnyQPnCPNknpt-po1Xo8qiYb-ZzJe6XWiWoGeuUsyAbiK51-AqV55ILO2VD60LqMS4SArs2AUgojkzhNoneSVrKm6YQT4DgZ9YEfHqFGB7zK6r3UxqnirhPeYwVMckkGLNgnL0tbobxeodsGf2j700CN0GAkmHSt4fWA8bnh6eTnKFZ4i8JLSuU8W7-PQZb_iVQy68T3rzd0Xfsi7Wb2OLg065z_Qm_xV8S6YX6YWA_PitVPSfB6CREmXdk" />
                <span className="absolute top-4 left-4 bg-[#CDEBC5] text-[#092009] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-h3 text-h3 text-primary mb-1">The Heights Private Cave</h3>
                    <p className="font-body-sm text-body-sm text-outline">1200 Westview Pkwy, Suite 4</p>
                  </div>
                  <div className="text-right">
                    <p className="font-h3 text-h3 text-primary">$240</p>
                    <p className="font-body-sm text-body-sm text-outline">/mo</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 bg-primary-container text-on-primary py-3 rounded-full font-manrope text-sm font-bold hover:opacity-95 transition-opacity">Manage Unit</button>
                  <button className="w-12 h-12 flex items-center justify-center border border-[#EBEBE8] rounded-full hover:bg-surface-container transition-colors"><span className="material-symbols-outlined" data-icon="more_horiz">more_horiz</span></button>
                </div>
              </div>
            </article>
            {/* Rental Card 2 */}
            <article className="group bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] transition-all hover:translate-y-[-4px]">
              <div className="h-64 relative overflow-hidden">
                <img alt="Downtown Micro-Cell" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A luxury underground storage vault with high-security features, including a keypad and premium steel doors. The space is illuminated by recessed cool-white LEDs that cast soft shadows on the pristine floors. The overall aesthetic is refined minimalism, emphasizing security, stability, and high-value asset protection through a sophisticated monochromatic palette with deep green accents." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6RKOFNy5SmNhy6h7RiPdwTKdwfYQurLvsGz2IqI3B8v-sDUZ8BkjT88XSBkGjK4CPQZoXzUq-aLXWb7uDOMGy0T0cme0uei_eidg3ut7e5xWqjy0LDP--wB6VfvXpoKhX5OOYNmSCgVJM3fJ8MDcHpNOkmE0fXtew8RkDB1DedW3IDEdlkaV_NOAoxuNU_0vX1pFflDQ4Ef9YGBavpHbWLyMNBb6aqw9pqbe6fTPSO-6miTH4OP00GTb-FN-194X9z0q7mVQVxOg" />
                <span className="absolute top-4 left-4 bg-[#CDEBC5] text-[#092009] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-h3 text-h3 text-primary mb-1">Downtown Micro-Cell</h3>
                    <p className="font-body-sm text-body-sm text-outline">45 Market St, Vault B</p>
                  </div>
                  <div className="text-right">
                    <p className="font-h3 text-h3 text-primary">$185</p>
                    <p className="font-body-sm text-body-sm text-outline">/mo</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 bg-primary-container text-on-primary py-3 rounded-full font-manrope text-sm font-bold hover:opacity-95 transition-opacity">Manage Unit</button>
                  <button className="w-12 h-12 flex items-center justify-center border border-[#EBEBE8] rounded-full hover:bg-surface-container transition-colors"><span className="material-symbols-outlined" data-icon="more_horiz">more_horiz</span></button>
                </div>
              </div>
            </article>
          </div>
        </section>
        {/* Past Rentals */}
        <section>
          <h2 className="font-h2 text-h2 text-primary mb-8">Past Rentals</h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface-container-lowest rounded-lg border border-[#EBEBE8]">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden"><img alt="Oak Creek Depot" className="w-full h-full object-cover" data-alt="A clean, industrial-style storage unit with a roll-up door and polished concrete flooring. The lighting is bright and even, highlighting the structural integrity of the building. The mood is calm and professional, using a palette of light neutrals and soft greys to reinforce the theme of security and spatial abundance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAJVskKNoaaYMInar5okyo5MGWyiSfatjPPbev9kLABKMZNOq8-UV0u9H09R2G4yWAS2x_MKea2kjydyRUyt45HxmQ_T0put7UC-xA7V1Jud6pqW1LjyugOQGyX4k04eohBptUTYwT4yIWGjB1TyEnfX9fR3KdQog4vJXN3_7KokSp3e-inYDUD6JkG3xyywXj2l2EQ3K6oQXXPRyVuXUj2UYz5KPXc_yxYZzUI3qjkcAZ93nIAAPkQWYGQxVMyfHQvA0nJmyhtGI" /></div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-primary font-bold">Oak Creek Depot</h4>
                  <p className="font-body-sm text-body-sm text-outline">Jan 2023 - June 2024</p>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-12">
                <div className="text-right">
                  <p className="font-label-caps text-label-caps text-secondary mb-1 uppercase tracking-widest">Completed</p>
                  <p className="font-body-md text-body-md text-primary font-semibold">$120/mo</p>
                </div>
                <button className="text-primary-container font-bold hover:underline underline-offset-4 text-sm">Download Receipt</button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface-container-lowest rounded-lg border border-[#EBEBE8]">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden"><img alt="Riverside Box" className="w-full h-full object-cover" data-alt="A compact and efficient storage unit with high-quality metal walls and a secure latch system. The interior is well-lit with high-key lighting that creates a bright, modern light-mode aesthetic. The composition is clean and minimalist, focusing on the structural clarity and security of the space." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmoIY2m5gYbLs7-vpNWee8Eq4_OWfmw5EPjVwIUoDsnqHZkAMz9n8FVhGPWHP2B-wxnfNZLgrd5tnNEuqYJZSiCfsb0elheIc3jGaPFz1Wn2PQo8NT9qGQj4pAVsm1C9EClyfdEllRixskgQOZa0KJqHJQxCaxg4dzHNlFueFmonxUmW4ZF_Ctku6JzCZPYIAPHc6La5Ty9cZJ0bi5hknY_9aKtb9acXG23pdS6p0Ap5USMVv2zIYkTQFHIvCq40xNXX5vcYzcjpU" /></div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-primary font-bold">Riverside Box</h4>
                  <p className="font-body-sm text-body-sm text-outline">Aug 2022 - Dec 2022</p>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-12">
                <div className="text-right">
                  <p className="font-label-caps text-label-caps text-secondary mb-1 uppercase tracking-widest">Completed</p>
                  <p className="font-body-md text-body-md text-primary font-semibold">$95/mo</p>
                </div>
                <button className="text-primary-container font-bold hover:underline underline-offset-4 text-sm">Download Receipt</button>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Footer from SCREEN_2 */}
      <footer className="bg-[#F2F0E9] w-full rounded-t-[48px] mt-20">
        <div className="flex flex-col md:flex-row justify-between items-start py-20 px-12 max-w-[1440px] mx-auto gap-12">
          <div className="max-w-xs">
            <div className="text-2xl font-bold text-[#0F3D3E] mb-4">GETYOURCAVE</div>
            <p className="font-manrope text-sm text-stone-600 mb-8 leading-relaxed">Architectural Serenity in Storage. Curating the world's most secure and beautiful private storage networks.</p>
            <div className="flex gap-4">
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-xl">share</span></span>
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-xl">public</span></span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-widest">Platform</h5>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">Find Storage</a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">List Your Space</a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">How it works</a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-widest">Trust</h5>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">Privacy</a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">Terms</a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">Host Guarantee</a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-widest">Resources</h5>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">Support</a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">Safety</a>
              <a className="text-stone-500 hover:text-[#0F3D3E] transition-colors text-sm" href="#">Cookies</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-12 pb-12 border-t border-primary/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-manrope text-sm text-stone-600">© 2024 GETYOURCAVE. Architectural Serenity in Storage.</p>
          <p className="text-xs text-stone-400">Designed for the discerning minimalist.</p>
        </div>
      </footer>
      </div>
    </>
  );
}
