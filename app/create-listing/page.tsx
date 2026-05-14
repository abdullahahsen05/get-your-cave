"use client";

export default function CreateListingPage() {
  return (
      <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
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
      </div>
  );
}

