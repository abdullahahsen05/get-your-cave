"use client";

export default function CreateListingPage() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        :global(*) { box-sizing: border-box; }
        :global(body) {
          margin: 0;
          background: #fcf9f8;
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
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
        }
        :global(.step-active) { font-variation-settings: "FILL" 1; }
        :global(.hide-scrollbar::-webkit-scrollbar) { display: none; }
        :global(.hide-scrollbar) { -ms-overflow-style: none; scrollbar-width: none; }

        :global(.font-body-md),
        :global(.font-body-sm),
        :global(.font-body-lg),
        :global(.font-h1),
        :global(.font-h2),
        :global(.font-h3),
        :global(.font-display),
        :global(.font-label-caps),
        :global(.font-italic-emphasis),
        :global(.font-manrope) { font-family: Manrope, sans-serif; }
        :global(.font-label-caps) { font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600; }
        :global(.font-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.font-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.font-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.text-body-sm) { font-size: 14px; line-height: 1.5; }
        :global(.text-body-md) { font-size: 16px; line-height: 1.6; }
        :global(.text-body-lg) { font-size: 18px; line-height: 1.6; }
        :global(.text-label-caps) { font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600; }
        :global(.text-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.text-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.text-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.italic-emphasis) { font-style: italic; }

        :global(.rounded-lg) { border-radius: 2rem; }
        :global(.rounded-xl) { border-radius: 3rem; }
        :global(.gap-gutter) { gap: 24px; }
        :global(.gap-lg) { gap: 24px; }
        :global(.gap-md) { gap: 16px; }
        :global(.gap-sm) { gap: 8px; }
        :global(.gap-xs) { gap: 4px; }
        :global(.p-xl) { padding: 48px; }
        :global(.p-lg) { padding: 24px; }
        :global(.p-md) { padding: 16px; }
        :global(.p-sm) { padding: 8px; }
        :global(.p-xs) { padding: 4px; }
        :global(.px-xl) { padding-left: 48px; padding-right: 48px; }
        :global(.py-xl) { padding-top: 48px; padding-bottom: 48px; }
        :global(.px-lg) { padding-left: 24px; padding-right: 24px; }
        :global(.py-lg) { padding-top: 24px; padding-bottom: 24px; }
        :global(.px-md) { padding-left: 16px; padding-right: 16px; }
        :global(.py-md) { padding-top: 16px; padding-bottom: 16px; }
        :global(.mb-xl) { margin-bottom: 48px; }
        :global(.mb-lg) { margin-bottom: 24px; }
        :global(.mb-md) { margin-bottom: 16px; }
        :global(.mb-sm) { margin-bottom: 8px; }
        :global(.mb-xs) { margin-bottom: 4px; }
        :global(.mt-xl) { margin-top: 48px; }
        :global(.mt-lg) { margin-top: 24px; }
        :global(.mt-md) { margin-top: 16px; }
        :global(.mt-sm) { margin-top: 8px; }
        :global(.mt-xs) { margin-top: 4px; }
        :global(.space-y-lg > :not([hidden]) ~ :not([hidden])) { margin-top: 24px; }
        :global(.space-y-md > :not([hidden]) ~ :not([hidden])) { margin-top: 16px; }
        :global(.space-y-sm > :not([hidden]) ~ :not([hidden])) { margin-top: 8px; }
        :global(.space-y-xs > :not([hidden]) ~ :not([hidden])) { margin-top: 4px; }
        :global(.pt-xxl) { padding-top: 80px; }
        :global(.pb-xxl) { padding-bottom: 80px; }
        :global(.px-xxl) { padding-left: 80px; padding-right: 80px; }

        :global(.bg-background) { background-color: #fcf9f8; }
        :global(.bg-surface) { background-color: #fcf9f8; }
        :global(.bg-primary) { background-color: #002627; }
        :global(.bg-primary-container) { background-color: #0f3d3e; }
        :global(.bg-secondary) { background-color: #4b6547; }
        :global(.bg-secondary-container) { background-color: #cdebc5; }
        :global(.bg-surface-container) { background-color: #f0eded; }
        :global(.bg-surface-container-low) { background-color: #f6f3f2; }
        :global(.bg-surface-container-high) { background-color: #eae7e7; }
        :global(.bg-surface-container-lowest) { background-color: #ffffff; }
        :global(.bg-surface-variant) { background-color: #e5e2e1; }
        :global(.bg-primary-fixed) { background-color: #beebeb; }
        :global(.text-primary) { color: #002627; }
        :global(.text-primary-container) { color: #0f3d3e; }
        :global(.text-secondary) { color: #4b6547; }
        :global(.text-outline) { color: #717978; }
        :global(.text-on-background) { color: #1c1b1b; }
        :global(.text-on-surface) { color: #1c1b1b; }
        :global(.text-on-surface-variant) { color: #404848; }
        :global(.text-on-secondary-container) { color: #516b4d; }
        :global(.border-outline) { border-color: #717978; }
        :global(.border-outline-variant) { border-color: #c0c8c8; }
        :global(.border-primary) { border-color: #002627; }
        :global(.border-secondary-container) { border-color: #cdebc5; }
        :global(.border-surface-variant) { border-color: #e5e2e1; }

        :global(.bg-primary\/5) { background-color: rgba(0, 38, 39, 0.05); }
        :global(.bg-primary-container\/60) { background-color: rgba(15, 61, 62, 0.6); }
        :global(.bg-secondary-container\/20) { background-color: rgba(205, 235, 197, 0.2); }
        :global(.text-primary\/60) { color: rgba(0, 38, 39, 0.6); }
        :global(.text-white\/70) { color: rgba(255, 255, 255, 0.7); }
        :global(.hover\:text-primary:hover) { color: #002627; }
        :global(.hover\:text-white:hover) { color: #fff; }
        :global(.hover\:bg-primary:hover) { background-color: #002627; }
        :global(.hover\:bg-white:hover) { background-color: #fff; }
        :global(.hover\:bg-surface-variant:hover) { background-color: #e5e2e1; }
        :global(.hover\:border-surface-variant:hover) { border-color: #e5e2e1; }
        :global(.group:hover .group-hover\:text-primary) { color: #002627; }

      `}</style>
      <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
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
<main className="flex-grow pt-32 pb-20 px-4 md:px-8">
<div className="max-w-4xl mx-auto">
<div className="bg-surface-container-lowest rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] overflow-hidden">
<div className="p-8 border-b border-surface-variant">
<div className="flex justify-between items-end mb-6">
<div>
<span className="text-label-caps font-label-caps text-secondary uppercase block mb-1">Step 1 of 5</span>
<h1 className="text-h2 font-h2 text-primary">Basic Details</h1>
</div>
<div className="text-right">
<span className="text-body-sm font-body-sm text-outline">60% to completion</span>
</div>
</div>
<div className="relative w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
<div className="absolute top-0 left-0 h-full bg-secondary w-1/5 rounded-full transition-all duration-500"></div>
</div>
<div className="flex justify-between mt-4">
<div className="flex flex-col items-center gap-1">
<span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
<span className="text-[10px] font-semibold text-primary uppercase tracking-tighter">Details</span>
</div>
<div className="flex flex-col items-center gap-1 opacity-30">
<span className="material-symbols-outlined text-outline">image</span>
<span className="text-[10px] font-semibold text-outline uppercase tracking-tighter">Images</span>
</div>
<div className="flex flex-col items-center gap-1 opacity-30">
<span className="material-symbols-outlined text-outline">payments</span>
<span className="text-[10px] font-semibold text-outline uppercase tracking-tighter">Pricing</span>
</div>
<div className="flex flex-col items-center gap-1 opacity-30">
<span className="material-symbols-outlined text-outline">location_on</span>
<span className="text-[10px] font-semibold text-outline uppercase tracking-tighter">Location</span>
</div>
<div className="flex flex-col items-center gap-1 opacity-30">
<span className="material-symbols-outlined text-outline">verified_user</span>
<span className="text-[10px] font-semibold text-outline uppercase tracking-tighter">Features</span>
</div>
</div>
</div>
<div className="p-8 md:p-12 space-y-12">
<section className="space-y-6">
<div className="space-y-2">
<label className="text-label-caps font-label-caps text-primary/60 uppercase">Cave Title</label>
<input className="w-full bg-[#F2F0E9]/50 border-none rounded-full px-6 py-4 text-body-md font-manrope placeholder-stone-400 focus:ring-1 focus:ring-primary transition-all text-on-surface" placeholder="e.g., Climate-Controlled Wine Cellar in TriBeCa" type="text"/>
</div>
<div className="space-y-2">
<label className="text-label-caps font-label-caps text-primary/60 uppercase">Description</label>
<textarea className="w-full bg-[#F2F0E9]/50 border-none rounded-lg px-6 py-4 text-body-md font-manrope placeholder-stone-400 focus:ring-1 focus:ring-primary transition-all text-on-surface resize-none" placeholder="Describe the spatial qualities, security, and accessibility of your storage space..." rows={4}></textarea>
</div>
</section>
<section className="space-y-4">
<label className="text-label-caps font-label-caps text-primary/60 uppercase">Storage Type</label>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
<button className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-primary bg-primary/5 transition-all group">
<span className="material-symbols-outlined text-primary mb-2 text-3xl">garage</span>
<span className="text-body-sm font-semibold text-primary">Garage</span>
</button>
<button className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-transparent bg-surface-container-low hover:border-surface-variant transition-all group">
<span className="material-symbols-outlined text-outline group-hover:text-primary mb-2 text-3xl">foundation</span>
<span className="text-body-sm font-semibold text-outline group-hover:text-primary">Basement</span>
</button>
<button className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-transparent bg-surface-container-low hover:border-surface-variant transition-all group">
<span className="material-symbols-outlined text-outline group-hover:text-primary mb-2 text-3xl">meeting_room</span>
<span className="text-body-sm font-semibold text-outline group-hover:text-primary">Room</span>
</button>
<button className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-transparent bg-surface-container-low hover:border-surface-variant transition-all group">
<span className="material-symbols-outlined text-outline group-hover:text-primary mb-2 text-3xl">warehouse</span>
<span className="text-body-sm font-semibold text-outline group-hover:text-primary">Warehouse</span>
</button>
</div>
</section>
</div>
<div className="p-8 bg-surface-container-low border-t border-surface-variant flex items-center justify-between">
<button className="flex items-center gap-2 px-6 py-3 text-outline font-semibold opacity-50 cursor-not-allowed" disabled>
<span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>
<div className="flex items-center gap-4">
<button className="px-6 py-3 text-primary font-semibold hover:bg-surface-variant rounded-full transition-colors">
                            Save Draft
                        </button>
<button className="px-10 py-3 bg-primary-container text-white font-bold rounded-full scale-100 hover:scale-105 active:scale-95 transition-all shadow-md">
                            Next Step
                        </button>
</div>
</div>
</div>
<div className="mt-8 p-6 bg-secondary-container/20 rounded-lg border border-secondary-container flex gap-4 items-start">
<span className="material-symbols-outlined text-secondary">lightbulb</span>
<p className="text-body-sm text-on-secondary-container">
<strong className="block mb-1">Architect's Tip:</strong>
                    Detailed descriptions of climate stability and floor loading capacities attract high-value preservationists. Spaces in TriBeCa currently have a 94% occupancy rate.
                </p>
</div>
</div>
</main>
<footer className="bg-[#F2F0E9] w-full rounded-t-[48px] mt-20">
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
