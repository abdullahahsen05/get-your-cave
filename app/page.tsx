"use client";

export default function HomeLandingPageScalableExact() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        :global(*) { box-sizing: border-box; }
        :global(html) { scroll-behavior: smooth; }
        :global(body) { margin: 0; background: #fcf9f8; font-family: Manrope, sans-serif; color: #1c1b1b; }
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
        :global(.fill-1) { font-variation-settings: "FILL" 1, "wght" 300, "GRAD" 0, "opsz" 24; }
        :global(.hero-grid-cols) { grid-template-columns: repeat(12, minmax(0, 1fr)); }

        :global(.font-body-md), :global(.font-body-sm), :global(.font-body-lg), :global(.font-h1), :global(.font-h2), :global(.font-h3), :global(.font-display), :global(.font-label-caps), :global(.font-italic-emphasis), :global(.font-manrope) { font-family: Manrope, sans-serif; }
        :global(.font-label-caps) { font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600; }
        :global(.font-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.font-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.font-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.font-display) { font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 800; }
        :global(.text-body-sm) { font-size: 14px; line-height: 1.5; }
        :global(.text-body-md) { font-size: 16px; line-height: 1.6; }
        :global(.text-body-lg) { font-size: 18px; line-height: 1.6; }
        :global(.text-label-caps) { font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600; }
        :global(.text-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.text-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.text-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.text-display) { font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 800; }
        :global(.italic-emphasis) { font-style: italic; }

        :global(.rounded-lg) { border-radius: 2rem; }
        :global(.rounded-xl) { border-radius: 3rem; }
        :global(.gap-gutter) { gap: 24px; }
        :global(.gap-lg) { gap: 24px; }
        :global(.gap-xxl) { gap: 80px; }
        :global(.py-xxl) { padding-top: 80px; padding-bottom: 80px; }
        :global(.p-lg) { padding: 24px; }
        :global(.p-xl) { padding: 48px; }
        :global(.px-xl) { padding-left: 48px; padding-right: 48px; }
        :global(.mt-xxl) { margin-top: 80px; }

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
        :global(.text-on-surface) { color: #1c1b1b; }
        :global(.text-on-background) { color: #1c1b1b; }
        :global(.text-on-surface-variant) { color: #404848; }
        :global(.text-on-secondary-container) { color: #516b4d; }
        :global(.text-secondary) { color: #4b6547; }
        :global(.text-outline) { color: #717978; }
        :global(.border-outline-variant) { border-color: #c0c8c8; }
        :global(.border-primary) { border-color: #002627; }
        :global(.border-surface-variant) { border-color: #e5e2e1; }
        :global(.bg-primary\/5) { background-color: rgba(0,38,39,.05); }
        :global(.bg-primary\/20) { background-color: rgba(0,38,39,.2); }
        :global(.bg-secondary-container\/20) { background-color: rgba(205,235,197,.2); }
        :global(.bg-secondary-container\/30) { background-color: rgba(205,235,197,.3); }
        :global(.bg-surface-container-low\/20) { background-color: rgba(246,243,242,.2); }
        :global(.bg-white\/70) { background-color: rgba(255,255,255,.7); }
        :global(.text-white\/60) { color: rgba(255,255,255,.6); }
        :global(.text-white\/70) { color: rgba(255,255,255,.7); }
        :global(.text-\[\#FFB800\]) { color: #ffb800; }
        :global(.border-outline-variant\/20) { border-color: rgba(192,200,200,.2); }
        :global(.border-outline-variant\/30) { border-color: rgba(192,200,200,.3); }
        :global(.border-primary\/5) { border-color: rgba(0,38,39,.05); }
        :global(.hover\:text-primary:hover) { color: #002627; }
        :global(.hover\:bg-primary:hover) { background-color: #002627; }
        :global(.hover\:text-white:hover) { color: #fff; }
        :global(.hover\:border-primary\/20:hover) { border-color: rgba(0,38,39,.2); }
`}</style>
      <div className="bg-background text-on-surface antialiased">
<header className="fixed top-4 w-full z-50 px-6">
<div className="max-w-[1440px] mx-auto">
<nav className="bg-white rounded-full px-8 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
<div className="flex items-center gap-2"><div className="flex items-center gap-3">
<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#002627]">
<span className="material-symbols-outlined text-white text-xl">architecture</span>
</div>
<div className="text-sm font-bold tracking-[0.2em] text-[#002627]">GET YOUR CAVE</div>
</div></div>
<div className="hidden lg:flex items-center gap-8">
<a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">Home</a>
<a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">Browse Storage</a>
<a className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors" href="#">How it Works</a>
<div className="relative group">
<button className="flex items-center gap-1 font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors py-4">
                        For Owners
                        <span className="material-symbols-outlined text-sm">expand_more</span>
</button>
<div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-[900px]">
<div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 p-10 flex gap-12">
<div className="flex-1">
<h4 className="font-bold text-[#002627] mb-6">List &amp; Earn</h4>
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
<div className="flex-1">
<h4 className="font-bold text-[#002627] mb-6">Resources</h4>
<div className="space-y-4">
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">menu_book</span>
<span className="text-sm font-medium">Owner Guide</span>
</a>
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">verified_user</span>
<span className="text-sm font-medium">Safety &amp; Security</span>
</a>
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">sell</span>
<span className="text-sm font-medium">Pricing &amp; Fees</span>
</a>
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">support_agent</span>
<span className="text-sm font-medium">Help Center</span>
</a>
</div>
</div>
<div className="flex-1">
<h4 className="font-bold text-[#002627] mb-6">Tools</h4>
<div className="space-y-4">
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">dashboard</span>
<span className="text-sm font-medium">Dashboard Overview</span>
</a>
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">payments</span>
<span className="text-sm font-medium">Payouts &amp; Payments</span>
</a>
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">description</span>
<span className="text-sm font-medium">Contracts &amp; Docs</span>
</a>
<a className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors" href="#">
<span className="material-symbols-outlined text-stone-400">task_alt</span>
<span className="text-sm font-medium">Verification Process</span>
</a>
</div>
</div>
<div className="w-72 bg-[#002627] rounded-[1.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
<div className="relative z-10">
<h4 className="text-xl font-bold mb-3">Become an Owner</h4>
<p className="text-white/70 text-sm mb-6 leading-relaxed">Turn your unused space into a steady income.</p>
</div>
<button className="relative z-10 bg-[#CDEBC5] text-[#002627] px-6 py-3 rounded-full font-bold text-sm flex items-center justify-between group/btn hover:bg-white transition-colors">
                                    List Your Space
                                    <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
</button>
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
<div className="flex items-center gap-4">
<button className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors">
<span className="material-symbols-outlined text-xl">person</span>
</button>
<button className="bg-[#002627] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#002627]/20">
                    List Your Space
                </button>
</div>
</nav>
</div>
</header>
<section className="min-h-screen w-full bg-[#F7F7F5] pb-20 flex items-center pt-40">
<div className="max-w-[1440px] mx-auto px-12 w-full">
<div className="grid hero-grid-cols gap-0 items-center">
<div className="col-span-5">
<span className="text-[14px] font-semibold text-stone-400 tracking-[0.1em] uppercase block mb-6">SECURE STORAGE SOLUTIONS</span>
<h1 className="text-[64px] font-bold text-[#0F3D3E] leading-[1.1] max-w-[480px] mb-8">
                    Find secure storage near <span className="italic font-normal">you</span>
</h1>
<p className="text-[18px] leading-[1.6] text-stone-600 max-w-[420px] mb-10">
                    Experience the peace of mind that comes with architectural-grade protection and seamless booking.
                </p>
<div className="flex items-center gap-8">
<button className="bg-[#0F3D3E] text-white px-10 h-[48px] flex items-center justify-center rounded-full font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-md">
                        Find Storage
                    </button>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[#FFB800] fill-1">star</span>
<span className="text-stone-700 font-medium">4.9/5 from 2,000+ users</span>
</div>
</div>
</div>
<div className="col-span-1"></div>
<div className="col-span-6">
<div className="grid grid-cols-2 grid-rows-2 gap-[20px]">
<div className="bg-[#ECEBE6] rounded-[16px] p-6 flex items-end justify-center h-[300px] overflow-hidden shadow-sm">
<div className="w-3/4 h-[90%] bg-white rounded-t-[20px] border-x-[6px] border-t-[6px] border-stone-800 shadow-xl p-4">
<div className="w-full h-2 bg-stone-100 rounded-full mb-4"></div>
<div className="space-y-3">
<div className="w-full h-20 bg-stone-50 rounded-lg border border-stone-100"></div>
<div className="w-full h-4 bg-stone-50 rounded-full"></div>
<div className="w-2/3 h-4 bg-stone-50 rounded-full"></div>
</div>
</div>
</div>
<div className="bg-[#E4E9E2] rounded-[16px] p-8 flex flex-col justify-between h-[300px] shadow-sm">
<span className="material-symbols-outlined text-[#0F3D3E] text-4xl">public</span>
<div>
<div className="text-[52px] font-bold text-[#0F3D3E] leading-none mb-1">56+</div>
<div className="text-stone-600 font-semibold tracking-wide uppercase text-sm">Cities Nationwide</div>
</div>
</div>
<div className="bg-[#F0F0F0] rounded-[16px] p-8 flex flex-col justify-between h-[300px] shadow-sm">
<div className="flex items-center gap-1">
<span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">star</span>
<span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">star</span>
<span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">star</span>
<span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">star</span>
</div>
<div>
<div className="flex -space-x-3 mb-4">
<img alt="User" className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqHEqt0RWhmdF_GpRoXrBzUY25jLA14ju6LIeSvMPYwZf3H9dZSOASEKdkfqeRScCXFTH4hoq0cfiZlV8EMSm_XclyLCvusTp35SYX2wafIP0p_fd6kpduiv7ukrgHELnd-fDk2Lv7FE-gg3HVUoamT1vdZsHfS3lrrbPXORM0jgfG0QPdr0VMmezeehVf_Ve7Aef3w5vAuh0AnjQd4wedPD7Y5cB3YxVld1n_DcusNzY9XsfNu-rWBU-NWkfLJY4-T3x7HjGyB6M"/>
<img alt="User" className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtKHr5i3U1JF7nJWj1Y0_ygAoHV2Xqn1WPKY67KGjAxE6YlhpeC_NNaNSWDN2kD8PY2b1J5NHdmYx6REoOeWw4X_XyS976X-gOP0piKjZoR3kWhPMGpr7ShEqZ1fspbD2B1Okj_9aKiBKaayQ_yRJJjYU0Vn564XjhFmif_3dQofAZcFzpa4CBZ8au-Z8MxXnC-tC224fxe1_6OHiC8aYvdQ3LyIDeSGurMw8A0zNh6X1JB3Sct6ZkW-ZRMGGV3yZnp2qIGWiJkS8"/>
<img alt="User" className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASvXVWmaD5vig7Ze51DeKr0wKkNvGi5zKXto_0M0SUznS8dun3SwmCMhkPVCLW0JobyQNabmMHXLgnEHWrcxAcd3vLZYKudRNf_LsSO3tsCs4Th9ABHygt01te7qxjBW3Wbb_Xcn-f64mAK6Xn-zNnpf_QMIewUpnbIZ3RRzyDwQU5IU5yfLiosQk0heVdf_PeYRPd_Ti9dGi9_Sg3hg6EeuuXdxgjfXJPoNarpFDlCVKA9YuewdG0n2QHu68xupQchZYOCE_NJ74"/>
<img alt="User" className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ7anrlDclyUuJJ2JtRK3D_axEqiyEK8DXFTVdqvV3rwSAU2ikktvX_mDbgOc3PL8ZDe-bT3FxQANug1vOrE8j9vCw1qCoOKWPzve63DKrs6EcMsQbav0z7FzsTR8zN7MTniVhMOSdlXyfoi25PiKcCPyaZUZoLO-1JRgc3XXleqpReCLZuZi0rUsPz7J2mFxijBZ37RJVLRebaId7Ji8clKapJF419tTGHl9cQUSgQArmSNE0sxRtQXR1gT7f7r5Rb5f8c45JjxY"/>
</div>
<div className="text-stone-600 font-semibold tracking-wide uppercase text-sm">Active Users</div>
</div>
</div>
<div className="bg-[#0F3D3E] rounded-[16px] p-8 flex flex-col justify-between h-[300px] shadow-sm text-white">
<div className="w-full h-12 flex items-end">
<svg className="w-full h-full" fill="none" viewBox="0 0 100 40">
<path d="M0 35 C20 35, 40 5, 60 20 C80 35, 100 10, 100 10" fill="none" stroke="#7DA8A8" strokeWidth="2"></path>
</svg>
</div>
<div>
<div className="text-[40px] font-bold leading-none mb-1">$196,000</div>
<div className="text-white/60 font-semibold tracking-wide uppercase text-sm">Host Earnings</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
<section className="py-16 bg-surface border-b border-outline-variant/30">
<div className="max-w-[1440px] mx-auto px-12">
<p className="text-center font-label-caps text-label-caps text-outline mb-10 opacity-60">FEATURED IN</p>
<div className="flex flex-wrap justify-center items-center gap-16 grayscale opacity-40">
<span className="font-display text-h3 font-bold tracking-tighter">ARCHITECTURAL DIGEST</span>
<span className="font-display text-h3 font-bold tracking-tighter">WIRED</span>
<span className="font-display text-h3 font-bold tracking-tighter">FORBES</span>
<span className="font-display text-h3 font-bold tracking-tighter">DWELL</span>
<span className="font-display text-h3 font-bold tracking-tighter">MONOCLE</span>
</div>
</div>
</section>
<section className="py-xxl bg-background">
<div className="max-w-3xl mx-auto px-12 text-center">
<h2 className="font-h1 text-h1 mb-8 text-primary">Storage <span className="italic font-light">made simple.</span></h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">
                GETYOURCAVE reimagines the storage industry through a lens of curated hospitality. We connect discerning owners of underutilized spaces with individuals seeking high-quality, local environments for their most valued assets. Our platform ensures that every 'cave' meets a standard of architectural serenity and uncompromising security.
            </p>
</div>
</section>
<section className="py-xxl bg-surface">
<div className="max-w-[1440px] mx-auto px-12">
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<div className="p-lg flex flex-col items-center text-center group">
<div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
<span className="material-symbols-outlined text-primary text-3xl" data-icon="search">search</span>
</div>
<h3 className="font-h3 text-h3 mb-4">Search</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Explore a curated map of local, high-end storage spaces in your immediate neighborhood.</p>
</div>
<div className="p-lg flex flex-col items-center text-center group">
<div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
<span className="material-symbols-outlined text-primary text-3xl" data-icon="event_available">event_available</span>
</div>
<h3 className="font-h3 text-h3 mb-4">Book</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Secure your spot online with our seamless, verified booking and payment system.</p>
</div>
<div className="p-lg flex flex-col items-center text-center group">
<div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
<span className="material-symbols-outlined text-primary text-3xl" data-icon="key">key</span>
</div>
<h3 className="font-h3 text-h3 mb-4">Store</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Move in with confidence and enjoy 24/7 peace of mind in your new private cave.</p>
</div>
</div>
</div>
</section>
<section className="py-xxl bg-background">
<div className="max-w-[1440px] mx-auto px-12">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
<div className="rounded-lg overflow-hidden shadow-2xl shadow-primary/5">
<img className="w-full h-[500px] object-cover" data-alt="A bright, airy residential garage converted into a high-end studio storage space. Light wood flooring meets pristine white walls, with architectural track lighting accentuating the clean lines of the room. It feels like a boutique gallery rather than a traditional storage unit. The mood is calm, upscale, and organized, emphasizing the potential of unused residential space." src="https://lh3.googleusercontent.com/aida-public/AB6AXuATpxMWB32JAG2GFOK1AQmmaEIR6betJXaH2wpWO9Ect5gFsCPsA2Vq8DDAtvsW7igp-2mQjbvk2hP8LPkHsry_BkYueJulVTR-5VgXJzu0o8NSk2WRDJ_ScYjSbTsRICrrPPTYCBJjAULTqeKu_NKUKBbLPPifqa0sJbmeWFYhXKK15QPkv7i5zYaYRR5MQgXeJOub_St6njVrP96izLbV7TsTX8vYnBr7OCd0c4bqrRkP4-aEnD7ok2lWFTZwqtTafTrdu0dPykU"/>
</div>
<div className="lg:pl-12">
<span className="font-label-caps text-label-caps text-secondary mb-4 block">FOR PROPERTY OWNERS</span>
<h2 className="font-h1 text-h1 mb-6 text-primary">Your unused space <span className="italic">is an asset.</span></h2>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-10">
                        Transform your empty basement, garage, or spare room into a high-yield revenue stream. We provide the tools, the trust, and the insurance to make hosting simple and rewarding.
                    </p>
<button className="bg-[#0F3D3E] text-white px-10 py-5 rounded-full font-manrope font-bold text-lg active:scale-95 transition-all">Start Listing</button>
</div>
</div>
</div>
</section>
<section className="py-xxl bg-surface-container-low">
<div className="max-w-[1440px] mx-auto px-12">
<div className="flex justify-between items-end mb-12">
<div>
<h2 className="font-h1 text-h1 text-primary">Available Caves</h2>
<p className="font-body-md text-on-surface-variant mt-2">Premium storage currently available in your area.</p>
</div>
<button className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all">
                    View full map <span className="material-symbols-outlined">arrow_forward</span>
</button>
</div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter h-[600px]">
<div className="lg:col-span-2 relative rounded-lg overflow-hidden bg-surface-container shadow-inner">
<img className="w-full h-full object-cover" data-alt="A minimalist digital map interface showing a stylized urban grid in muted beige and sage tones. Subtle, elegant map pins in primary dark green are scattered across the neighborhoods. The interface is clean, professional, and avoids visual clutter, reflecting a high-end real estate or fintech aesthetic." data-location="San Francisco" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZis-myS5KP7UUoco2lzJ7dIxoSihYKp8CK-zHwJcQ_7f14dSVkAhWkwuz6lLjc1_VJEUX1zNiLLQk0vbsfjm5oN-XwjWageE8AqESZiBnjAcXZuKyp6lCHTxgiBY6Kk6FWDjSBMEZzTm8cxUpJX8kyb9uDBonzyZkB0LC3ZgJp9rsoEZIVpvz83yrB7CEgzWzAOu9mLdVssJ_sQK_jkDpDVFc87clZynwulsPaJSVweL5EhH5Zo8VLIxfa-iUZempAOZmexfKreU"/>
<div className="absolute top-1/3 left-1/4 w-10 h-10 bg-[#0F3D3E] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">$120</div>
<div className="absolute top-2/3 left-1/2 w-10 h-10 bg-[#0F3D3E] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">$85</div>
<div className="absolute top-1/4 left-3/4 w-10 h-10 bg-[#0F3D3E] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">$210</div>
</div>
<div className="flex flex-col gap-6 overflow-y-auto pr-2">
<div className="bg-background p-6 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-outline-variant/20 hover:border-primary/20 transition-all cursor-pointer">
<img className="w-full h-32 object-cover rounded-md mb-4" data-alt="Clean indoor storage space with soft lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvanMgbDoM75fNGhHAYCWN1kVhVYTie6hT-wtjwRAU5KbSqQ69pWLV-3GbQ5csInFWWy-TFQkcsYnl2wEQjPGL2XTKV8PURmMhXQiP8nemi9anwxMc1hUkMBpfOH-nZt4LQnzJBpzecxV6VWmwVdNAl1J2N4tDQiXspcOAwhlo2heLmIQ01QAtGmjB-kZ-qIjogVHeYA5lUakMVbewaARLwJg_mT_jyagDgGBYOmxsGG66PB2vKd82VgDqO4ht-0gtIpoEXZ0F-M0"/>
<div className="flex justify-between items-start mb-2">
<h4 className="font-h3 text-body-lg text-primary">The Heights Garage</h4>
<span className="font-bold text-primary">$120/mo</span>
</div>
<p className="text-body-sm text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-sm">location_on</span> Pacific Heights, SF
                        </p>
<p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-1">
<span className="material-symbols-outlined text-sm">square_foot</span> 150 sq ft
                        </p>
</div>
<div className="bg-background p-6 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-outline-variant/20 hover:border-primary/20 transition-all cursor-pointer">
<img className="w-full h-32 object-cover rounded-md mb-4" data-alt="Modern renovated basement space for storage." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWoo8Zsw06j8esugC8l1o4BX3B7CACiNFhOuTTYV059ReSnhWUO-2_eXHnTWLyLbYroWkT61uVV13XZ1wTL0BKOTqJYx4i3GamXUjvsvPw5yeYejjoQCLqRND0sGvjq6yCwaZ1ZPc881TvH0UGXGTHD06YNmCIjRtLekY108ZMjEqHCt2edA3fwypj2Rlp4zyp85y_NbZFTuAVdxJpHZ3PHZ2hDpU0R2jsFEMG__0Coeh4WikKYGYYJWpYXOvOtwqLmcauQwG7VQU"/>
<div className="flex justify-between items-start mb-2">
<h4 className="font-h3 text-body-lg text-primary">Mission Loft Storage</h4>
<span className="font-bold text-primary">$85/mo</span>
</div>
<p className="text-body-sm text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-sm">location_on</span> Mission District, SF
                        </p>
<p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-1">
<span className="material-symbols-outlined text-sm">square_foot</span> 75 sq ft
                        </p>
</div>
</div>
</div>
</div>
</section>
<section className="py-xxl bg-background">
<div className="max-w-[1440px] mx-auto px-12 text-center">
<span className="font-label-caps text-label-caps text-secondary mb-4 block">PEACE OF MIND</span>
<h2 className="font-h1 text-h1 text-primary mb-16">Security at the architectural level.</h2>
<div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
<div className="bg-surface p-xl rounded-lg border border-outline-variant/20">
<span className="material-symbols-outlined text-4xl text-secondary mb-6" data-icon="verified_user">verified_user</span>
<h3 className="font-h3 text-h3 mb-3">Verified Identity</h3>
<p className="font-body-md text-on-surface-variant">Every host and guest undergoes a rigorous identity verification process before joining.</p>
</div>
<div className="bg-surface p-xl rounded-lg border border-outline-variant/20">
<span className="material-symbols-outlined text-4xl text-secondary mb-6" data-icon="payments">payments</span>
<h3 className="font-h3 text-h3 mb-3">Secure Payments</h3>
<p className="font-body-md text-on-surface-variant">Transactions are encrypted and held in escrow until the move-in is confirmed successful.</p>
</div>
<div className="bg-surface p-xl rounded-lg border border-outline-variant/20">
<span className="material-symbols-outlined text-4xl text-secondary mb-6" data-icon="gavel">gavel</span>
<h3 className="font-h3 text-h3 mb-3">Legal Contracts</h3>
<p className="font-body-md text-on-surface-variant">Automated, binding rental agreements protect both parties and their valuable assets.</p>
</div>
</div>
</div>
</section>
<section className="bg-primary text-white py-24 overflow-hidden relative">
<div className="absolute inset-0 opacity-10">
<div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
<div className="absolute bottom-0 right-0 w-96 h-96 bg-on-primary-container rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
</div>
<div className="max-w-[1440px] mx-auto px-12 relative z-10">
<div className="flex flex-col md:flex-row justify-around items-center gap-16 text-center">
<div>
<p className="font-display text-[64px] font-extrabold tracking-tighter leading-none mb-2">12,000+</p>
<p className="font-label-caps text-label-caps opacity-70">ACTIVE STORAGE SPACES</p>
</div>
<div className="h-16 w-px bg-white/20 hidden md:block"></div>
<div>
<p className="font-display text-[64px] font-extrabold tracking-tighter leading-none mb-2">50+</p>
<p className="font-label-caps text-label-caps opacity-70">CITIES NATIONWIDE</p>
</div>
<div className="h-16 w-px bg-white/20 hidden md:block"></div>
<div>
<p className="font-display text-[64px] font-extrabold tracking-tighter leading-none mb-2">99.9%</p>
<p className="font-label-caps text-label-caps opacity-70">SAFETY RATING</p>
</div>
</div>
</div>
</section>
<section className="py-xxl bg-surface">
<div className="max-w-3xl mx-auto px-12">
<h2 className="font-h1 text-h1 text-primary text-center mb-16">Frequently Asked <span className="italic">Questions</span></h2>
<div className="space-y-4">
<div className="border-b border-outline-variant/30 pb-6">
<button className="w-full flex justify-between items-center text-left group">
<span className="font-h3 text-body-lg text-primary">Is my stuff insured while in storage?</span>
<span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
</button>
<div className="mt-4 text-on-surface-variant font-body-md">
                        Yes, every booking made through GETYOURCAVE is protected by our $25,000 Host Guarantee and specific contents insurance for guests.
                    </div>
</div>
<div className="border-b border-outline-variant/30 py-6">
<button className="w-full flex justify-between items-center text-left group">
<span className="font-h3 text-body-lg text-primary">How do payments work?</span>
<span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
</button>
</div>
<div className="border-b border-outline-variant/30 py-6">
<button className="w-full flex justify-between items-center text-left group">
<span className="font-h3 text-body-lg text-primary">Can I visit my storage space anytime?</span>
<span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
</button>
</div>
<div className="border-b border-outline-variant/30 py-6">
<button className="w-full flex justify-between items-center text-left group">
<span className="font-h3 text-body-lg text-primary">What items are prohibited?</span>
<span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
</button>
</div>
</div>
</div>
</section>
<section className="py-xxl">
<div className="max-w-[1440px] mx-auto px-12">
<div className="bg-[#F2F0E9] rounded-[48px] py-xxl px-12 text-center relative overflow-hidden">
<div className="relative z-10 max-w-2xl mx-auto">
<h2 className="font-h1 text-display text-primary mb-8">Ready to find <span className="italic">your cave?</span></h2>
<p className="font-body-lg text-on-surface-variant mb-12">Join thousands of others who have simplified their lives by finding or listing storage spaces today.</p>
<div className="flex flex-col sm:flex-row justify-center gap-6">
<button className="bg-[#0F3D3E] text-white px-12 py-5 rounded-full font-manrope font-bold text-lg active:scale-95 transition-all">Find Storage</button>
<button className="bg-transparent border border-[#0F3D3E] text-[#0F3D3E] px-12 py-5 rounded-full font-manrope font-bold text-lg active:scale-95 transition-all">List Your Space</button>
</div>
</div>
</div>
</div>
</section>
<footer className="bg-[#F2F0E9] w-full rounded-t-[48px]">
<div className="flex flex-col md:flex-row justify-between items-start py-20 px-12 max-w-[1440px] mx-auto gap-12">
<div className="max-w-xs">
<div className="text-2xl font-bold text-[#0F3D3E] mb-4">GETYOURCAVE</div>
<p className="font-manrope text-sm text-stone-600 mb-8 leading-relaxed">Architectural Serenity in Storage. Curating the world's most secure and beautiful private storage networks.</p>
<div className="flex gap-4">
<span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">
<span className="material-symbols-outlined text-xl">share</span>
</span>
<span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">
<span className="material-symbols-outlined text-xl">public</span>
</span>
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
