"use client";

export default function RenterDashboardPageDittoStyled() {
  return (
      <div className="bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed antialiased">
      {/* Floating Header from SCREEN_2 */}
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
            </div>
  );
}

