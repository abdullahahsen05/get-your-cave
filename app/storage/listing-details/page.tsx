"use client";

export default function ListingDetailPageDittoStyledFixed() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        :global(*) { box-sizing: border-box; }
        :global(html) { scroll-behavior: smooth; }
        :global(body) {
          margin: 0;
          background-color: #fcf9f8;
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

        :global(.hero-grid) {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: repeat(2, 250px);
          gap: 12px;
        }
        :global(.hero-grid > :first-child) { grid-row: span 2; }

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
        :global(.font-body-sm), :global(.text-body-sm) { font-size: 14px; line-height: 1.5; font-weight: 400; }
        :global(.font-body-md), :global(.text-body-md) { font-size: 16px; line-height: 1.6; font-weight: 400; }
        :global(.font-body-lg), :global(.text-body-lg) { font-size: 18px; line-height: 1.6; font-weight: 400; }
        :global(.font-display), :global(.text-display) { font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 800; }
        :global(.font-h1), :global(.text-h1) { font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 700; }
        :global(.font-h2), :global(.text-h2) { font-size: 28px; line-height: 1.3; font-weight: 700; }
        :global(.font-h3), :global(.text-h3) { font-size: 22px; line-height: 1.4; font-weight: 600; }
        :global(.font-label-caps), :global(.text-label-caps) { font-size: 12px; line-height: 1; letter-spacing: 0.05em; font-weight: 600; }
        :global(.italic-emphasis) { font-style: italic; }

        :global(.rounded-lg) { border-radius: 2rem; }
        :global(.rounded-xl) { border-radius: 3rem; }
        :global(.rounded-default) { border-radius: 1rem; }
        :global(.space-y-md) > * + * { margin-top: 16px; }
        :global(.space-y-lg) > * + * { margin-top: 24px; }
        :global(.space-y-xl) > * + * { margin-top: 48px; }
        :global(.gap-gutter) { gap: 24px; }
        :global(.gap-md) { gap: 16px; }
        :global(.gap-lg) { gap: 24px; }
        :global(.gap-xl) { gap: 48px; }
        :global(.gap-xxl) { gap: 80px; }
        :global(.px-gutter) { padding-left: 24px; padding-right: 24px; }
        :global(.px-md) { padding-left: 16px; padding-right: 16px; }
        :global(.py-sm) { padding-top: 8px; padding-bottom: 8px; }
        :global(.p-sm) { padding: 8px; }
        :global(.p-md) { padding: 16px; }
        :global(.p-lg) { padding: 24px; }
        :global(.p-xl) { padding: 48px; }
        :global(.mb-md) { margin-bottom: 16px; }
        :global(.mb-lg) { margin-bottom: 24px; }
        :global(.mt-lg) { margin-top: 24px; }
        :global(.px-xl) { padding-left: 48px; padding-right: 48px; }
        :global(.py-xl) { padding-top: 48px; padding-bottom: 48px; }
        :global(.pt-xl) { padding-top: 48px; }
        :global(.pb-xl) { padding-bottom: 48px; }
        :global(.mb-xl) { margin-bottom: 48px; }
        :global(.mt-xl) { margin-top: 48px; }
        :global(.pb-xxl) { padding-bottom: 80px; }
        :global(.py-xxl) { padding-top: 80px; padding-bottom: 80px; }
        :global(.mt-xxl) { margin-top: 80px; }

        :global(.bg-background), :global(.bg-surface) { background-color: #fcf9f8; }
        :global(.bg-surface-container) { background-color: #f0eded; }
        :global(.bg-surface-container-low) { background-color: #f6f3f2; }
        :global(.bg-surface-container-high) { background-color: #eae7e7; }
        :global(.bg-surface-container-lowest) { background-color: #ffffff; }
        :global(.bg-surface-variant) { background-color: #e5e2e1; }
        :global(.bg-primary), :global(.bg-primary-container) { background-color: #002627; }
        :global(.bg-secondary) { background-color: #4b6547; }
        :global(.bg-secondary-container) { background-color: #cdebc5; }
        :global(.bg-primary-fixed) { background-color: #beebeb; }
        :global(.bg-secondary-fixed-dim) { background-color: #b1cfaa; }
        :global(.bg-on-primary-container) { background-color: #7da8a8; }
        :global(.bg-secondary-container\/20) { background-color: rgba(205, 235, 197, 0.2); }
        :global(.selection\:bg-secondary-container::selection) { background-color: #cdebc5; }

        :global(.text-primary), :global(.text-primary-container) { color: #002627; }
        :global(.text-on-surface), :global(.text-on-background) { color: #1c1b1b; }
        :global(.text-on-surface-variant), :global(.text-outline) { color: #404848; }
        :global(.text-secondary) { color: #4b6547; }
        :global(.text-on-primary) { color: #ffffff; }
        :global(.text-on-secondary-container) { color: #516b4d; }
        :global(.text-surface-dim) { color: #dcd9d9; }
        :global(.text-on-primary-container) { color: #7da8a8; }
        :global(.border-outline-variant) { border-color: #c0c8c8; }
        :global(.border-secondary-container) { border-color: #cdebc5; }
        :global(.border-secondary-container\/30) { border-color: rgba(205, 235, 197, 0.3); }
        :global(.border-primary) { border-color: #002627; }
        :global(.border-outline-variant\/20) { border-color: rgba(192, 200, 200, 0.2); }
        :global(.border-outline-variant\/30) { border-color: rgba(192, 200, 200, 0.3); }
        :global(.hover\:bg-surface-container:hover) { background-color: #f0eded; }
        :global(.hover\:bg-surface-container-low:hover) { background-color: #f6f3f2; }
        :global(.hover\:opacity-90:hover) { opacity: .9; }
        :global(.hover\:opacity-95:hover) { opacity: .95; }

        @media (max-width: 768px) {
          :global(.hero-grid) {
            grid-template-columns: 1fr;
            grid-template-rows: none;
          }
          :global(.hero-grid > :first-child) { grid-row: auto; }
          :global(.hero-grid > *) { min-height: 220px; }
        }
`}</style>
      <div className="bg-background text-on-surface font-body-md selection:bg-secondary-container">
      {/* TopNavBar */}
      <nav className="fixed top-4 inset-x-0 mx-auto max-w-7xl rounded-full border border-stone-200 bg-[#F7F7F5]/90 backdrop-blur-md z-50 flex justify-between items-center px-8 py-3 w-full shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
        <div className="text-xl font-bold tracking-tighter text-[#0F3D3E]">GETYOURCAVE</div>
        <div className="hidden md:flex items-center gap-8 font-manrope text-sm tracking-tight font-medium">
          <a className="text-[#0F3D3E] font-bold border-b-2 border-[#0F3D3E] pb-1 transition-all duration-300" href="#">Browse Caves</a>
          <a className="text-stone-500 hover:text-[#0F3D3E] transition-all duration-300" href="#">Locations</a>
          <a className="text-stone-500 hover:text-[#0F3D3E] transition-all duration-300" href="#">Pricing</a>
          <a className="text-stone-500 hover:text-[#0F3D3E] transition-all duration-300" href="#">For Owners</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-[#0F3D3E] text-white px-6 py-2 rounded-full text-sm font-bold scale-95 active:scale-90 transition-transform">List a Space</button>
          <div className="flex gap-2 text-[#0F3D3E]">
            <span className="material-symbols-outlined cursor-pointer hover:opacity-70 transition-opacity">notifications</span>
            <span className="material-symbols-outlined cursor-pointer hover:opacity-70 transition-opacity">account_circle</span>
          </div>
        </div>
      </nav>
      <main className="pt-32 pb-xxl max-w-7xl mx-auto px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-lg gap-md">
          <div>
            <h1 className="font-h1 text-h1 text-primary mb-2">The Emerald Vault – Lower Manhattan</h1>
            <div className="flex items-center gap-4 text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold text-on-surface">4.98</span>
                <span>(124 reviews)</span>
              </div>
              <span className="text-surface-dim">•</span>
              <span className="underline font-medium cursor-pointer">Chelsea, New York City</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 font-label-caps text-label-caps hover:bg-surface-container transition-colors p-2 rounded-lg">
              <span className="material-symbols-outlined text-md">ios_share</span>
              SHARE
            </button>
            <button className="flex items-center gap-2 font-label-caps text-label-caps hover:bg-surface-container transition-colors p-2 rounded-lg">
              <span className="material-symbols-outlined text-md">favorite</span>
              SAVE
            </button>
          </div>
        </div>
        {/* Image Gallery (Airbnb Style) */}
        <div className="hero-grid mb-xl rounded-lg overflow-hidden">
          <div className="relative overflow-hidden group">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="A spacious, high-end storage unit with polished concrete floors and climate-controlled vents. The lighting is soft and architectural, highlighting the clean lines of the white walls and high ceilings. The atmosphere is quiet and secure, designed with a premium minimalist aesthetic using deep greens and soft neutrals to evoke a sense of absolute protection for luxury assets." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvOaq7w-wrMJTbpSflULdtVljsC7lPIQ-P_cOGDlmvmn0F-KWt9QJDgMY8isuu3BzCGvHS3nINmRP-Wvd8C1S_jiKBCjYKxBSsg_nT985iIqaWJtZBX8MfXpKuEH83_BwQ5_WDWF8TcFhxkNjkDvdsfVEswUa3UYhsBccvvVjdnTCrvWGroYVu7XP_80UhZeqyn-4PwcKaXRcdgsA5hRCXS5zHXdeEsTCxikgslZt5O34mV1ubp1lCQClnEWiFqErOPzBgTuxqDlA" />
          </div>
          <div className="relative overflow-hidden group">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="Close-up of a heavy-duty modern security door with a sleek digital keypad interface. The door is finished in a matte deep forest green, contrasting against the off-white textured walls of a luxury storage facility. The lighting is focused and clean, emphasizing technical precision and safety in an architectural setting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSFxERFxhCmvO_5DTcAE5yQr23z_XbX0R3Q3goZVT1D22dI5oktXZ3KYJOKlZwqDDIGJEk9jBt6WQtru4X4NUJcdHanvzmh1eGfvwg9fYB7TETbzlKlB-8F5YyV1M0ARPjm4CV5qAYXd46udsHMAVd4xvhHTDEjOiPJgCE-QYoAA_olEzXmDLmDx8VytGJ9QTSpfF5XdSyas_b3SDxxlgFRgbhw7xCF-PTUmllJdHApXhurbTQjmjT84e2DZ0PN0IJ2gAbuqNLgeg" />
          </div>
          <div className="relative overflow-hidden group">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="An interior view of a high-ceilinged room with minimalist shelving units made of light oak wood. The space is uncluttered and bright, filled with natural diffused light. The color palette consists of soft beiges and muted greens, creating a serene and spacious storage environment suitable for high-value collectibles or furniture." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBw7OtqXpeeS7Za_AX9FXVKblgSXKm4uvwdDjzks-eCoSk8sdjJohT8ZSKsaEjHv74cEl62qjO-HELBOw3Ez5dkkr431O-QQY1gwQYqKjCV5Ubp9HUW-1NPrJREVeFNOGUfJHyOjfuhLs7WLszKru1tT36vD2nMULm9feAp-a2Nm1BRrcz_PGCsFgDhq_tQjtMswRpl7GZq2-MI62VLRj_LX3GacmOz-2dg1vqxkw7obM4V6qJRrW3FrXJkvdReyfjIgQ8zj0_E7HM" />
          </div>
          <div className="relative overflow-hidden group">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="A brightly lit hallway of a premium storage facility with architectural lighting strips along the floor. The floors are a soft grey polished stone, and the walls are a warm ivory white. The mood is clinical yet inviting, reinforcing a high-tech and ultra-secure atmosphere for high-worth belongings." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0UjhpjVHjswTHB655fOm2QyB8fYwn1cZvpJwk5Agq3Alcq0b-46dDx4Mrt3gAxcRADRuv0dJhWkjz0sW9W4DsLYxFZKjSBQQjdUyYF-EKOvFVk6_KWwty-6uoQLxWhEiizsUmYajfmWzWJ-zELdI4miZ8ufz3hQfInqURHEB05FJRkjWB3MVEz4dwmC36yY8OfLfi0pzkQSIgEUTuHy1eZ2YT_cb7VXg5PG5K0D_2tUKVnhbytiiAq6vvo3BzRIvfURck0LhPjsE" />
          </div>
          <div className="relative overflow-hidden group">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="A minimalist waiting area or lobby of a storage facility featuring a single designer chair and a large green plant. The walls are a textured accent color, and the overall design is rooted in architectural serenity. The scene is quiet, high-end, and perfectly aligned with a luxury marketplace aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgyUWS7TI7LHwxZoCWpuuxqf-QSm3j5mL8H9QSLpBe-sXb1ZWMh5XcFsKTdcmss5J1dzbSW01dkBxBnS1HxfFXPL_sscFTueR2xtHczwZ-_ps0maGikUXfTNjPG9M4xJofahViTvf4_Cjl3TuoTWvI7byfaRtRdIhqf0LR2NoUNWLLTMMSrYTnj1f5wWuKFmseA3C9eE8LRaf5oQgjy3zl322EQvKyNGS2FAMraQYOjIhv_XmwvhcE9WF9yBiTBPxDvuq_KzvMArw" />
          </div>
        </div>
        {/* Main Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-xl">
          {/* Left Column: Content */}
          <div className="space-y-xl">
            {/* Header Stats */}
            <section className="border-b border-stone-200 pb-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-h2 text-h2 text-primary mb-2">Private Studio-Cave hosted by Julian</h2>
                  <p className="text-body-md text-on-surface-variant italic-emphasis italic opacity-80">120 sq ft • Climate Controlled • 24/7 Monitoring</p>
                </div>
                <img className="w-14 h-14 rounded-full object-cover border-2 border-secondary-container" data-alt="A professional and friendly headshot of Julian, a middle-aged property owner with a welcoming smile. He is dressed in a smart-casual blazer against a blurred architectural background. The image is warm and high-quality, reinforcing trust and premium service levels." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF7wUT1k9ZCAva5NgXcX8YJPvnMbhq-c6QeGKdpV3RSSiC6HlKMjzVW5v81zLTOTC-cyuM_VcCISM5sRIE88krwbGdHjZK3U1kcvpadgGhSJS0ulfN4p9sBUcPBQKZCyg9s_AVwMcoEtW07Q5fRCTpZ5MtgQC5tkYYCyJYBdAyNqpdWSENoMMXRZVaL38imcD1OTqh1q-8ylvF24Lk1NFIYfAh9vILuo2LpzpB7njG6ZSX_CfgKO5vL5mGcpFupaPmDj8fKXcNDBA" />
              </div>
            </section>
            {/* Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-lg py-sm">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
                <div>
                  <h4 className="font-bold text-body-md">Elite Security</h4>
                  <p className="text-body-sm text-on-surface-variant">Biometric access and 24/7 CCTV surveillance.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">thermostat</span>
                <div>
                  <h4 className="font-bold text-body-md">Climate Mastery</h4>
                  <p className="text-body-sm text-on-surface-variant">Strict 68°F and 45% humidity control.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">history_toggle_off</span>
                <div>
                  <h4 className="font-bold text-body-md">Unlimited Access</h4>
                  <p className="text-body-sm text-on-surface-variant">Enter your cave at any hour, 365 days a year.</p>
                </div>
              </div>
            </section>
            {/* Description */}
            <section className="border-t border-stone-200 pt-xl">
              <h3 className="font-h3 text-h3 text-primary mb-md">About this space</h3>
              <div className="space-y-md text-body-lg text-on-surface-variant leading-relaxed max-w-3xl">
                <p>Located in the heart of Chelsea's gallery district, The Emerald Vault offers a sanctuary for high-value items, from fine art collections to vintage furniture and sensitive tech equipment.</p>
                <p>This 120 sq ft unit features pristine, museum-grade white walls and industrial-strength concrete flooring. The "cave" is situated on the second floor of a private, gated facility with specialized freight elevator access. Designed for those who prioritize architectural serenity and absolute peace of mind.</p>
                <button className="font-bold text-primary underline underline-offset-4 flex items-center gap-1 mt-4">
                  Show more
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </section>
            {/* Owner Info */}
            <section className="bg-surface-container-low rounded-lg p-xl flex flex-col md:flex-row items-center gap-xl border border-stone-100">
              <img className="w-24 h-24 rounded-full object-cover" data-alt="Julian's profile photo in a larger, detailed format showing professional reliability." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8rmQ1WK92woRLRREM3LZAAZdKtGfGochBPq3oSmjMWGyUOfMqZWcn58WIidw9stv6tSr-bCGYYBv9tryVz0rC6sxbOGCBydbuJ1FevN2H9E5mip1CcVVNEoBLXagzcZYukfKXBAxLMEeR3_JYx6yqhkgA0dT_yYwVQblH9_xLZllUU9fR9deruLhtBStZghNRf4mIGSBbhuGAQOkZQ7pznwbL5ISJq7mNL5yiuljve5L1ivfVxgJq2nvFVIv16Ifce_9xL_6HNCM" />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-h2 text-h2 text-primary">Meet your host, Julian</h3>
                <p className="text-body-sm text-on-surface-variant mb-md">Joined in August 2019 • Response rate: 100%</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-lg">
                  <span className="flex items-center gap-1 text-body-sm font-semibold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    48 Reviews
                  </span>
                  <span className="flex items-center gap-1 text-body-sm font-semibold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Identity verified
                  </span>
                </div>
                <button className="bg-primary text-white px-xl py-3 rounded-full font-bold transition-all hover:opacity-90 active:scale-95">Contact Owner</button>
              </div>
            </section>
            {/* Reviews */}
            <section className="border-t border-stone-200 pt-xl">
              <div className="flex items-center gap-2 mb-xl">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <h3 className="font-h3 text-h3 text-primary">4.98 • 124 reviews</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <div className="space-y-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center font-bold text-on-secondary-container">ES</div>
                    <div>
                      <h5 className="font-bold">Eleanor Shellstrop</h5>
                      <p className="text-xs text-on-surface-variant">October 2023</p>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant italic-emphasis">Julian's space is impeccable. I stored my entire ceramics collection here for six months and everything remained in perfect condition. Truly a 'cave' for the soul.</p>
                </div>
                <div className="space-y-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-on-primary-container rounded-full flex items-center justify-center font-bold text-white">MK</div>
                    <div>
                      <h5 className="font-bold">Michael Koh</h5>
                      <p className="text-xs text-on-surface-variant">September 2023</p>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant italic-emphasis">Security here is better than most banks. The biometric entry is seamless. Highly recommended for anything high-value.</p>
                </div>
              </div>
            </section>
          </div>
          {/* Right Column: Sticky Booking Card */}
          <aside>
            <div className="sticky top-32 bg-white rounded-lg p-lg border border-stone-200 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
              <div className="flex justify-between items-baseline mb-lg">
                <span className="font-h2 text-h2 text-primary">
                  $240
                  <span className="text-body-md font-normal text-on-surface-variant">/ month</span>
                </span>
                <span className="text-body-sm font-semibold underline">Details</span>
              </div>
              <div className="border border-stone-200 rounded-lg overflow-hidden mb-lg">
                <div className="grid grid-cols-2 border-b border-stone-200">
                  <div className="p-3 border-r border-stone-200 cursor-pointer hover:bg-surface-container-low transition-colors">
                    <p className="font-label-caps text-[10px] text-on-surface-variant">MOVE-IN</p>
                    <p className="text-sm font-medium">May 12, 2024</p>
                  </div>
                  <div className="p-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                    <p className="font-label-caps text-[10px] text-on-surface-variant">DURATION</p>
                    <p className="text-sm font-medium">Monthly</p>
                  </div>
                </div>
                <div className="p-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                  <p className="font-label-caps text-[10px] text-on-surface-variant">UNIT SIZE</p>
                  <p className="text-sm font-medium">10' x 12' Studio</p>
                </div>
              </div>
              <button className="w-full bg-primary text-white py-4 rounded-full font-bold text-body-lg mb-lg scale-100 hover:opacity-95 active:scale-95 transition-all">Book Now</button>
              <p className="text-center text-body-sm text-on-surface-variant italic-emphasis mb-lg">You won't be charged yet</p>
              <div className="space-y-3">
                <div className="flex justify-between text-body-md">
                  <span className="underline">Monthly rate x 1</span>
                  <span>$240</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="underline">Security deposit</span>
                  <span>$0</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="underline">Cave insurance</span>
                  <span>$12</span>
                </div>
                <div className="border-t border-stone-200 pt-3 mt-4 flex justify-between font-bold text-primary text-body-lg">
                  <span>Total (monthly)</span>
                  <span>$252</span>
                </div>
              </div>
            </div>
            <div className="mt-lg p-lg bg-secondary-container/20 rounded-lg border border-secondary-container/30 flex gap-4 items-start">
              <span className="material-symbols-outlined text-secondary">verified</span>
              <div>
                <p className="font-bold text-primary text-sm">Protected by CaveShield</p>
                <p className="text-xs text-on-surface-variant">Every rental is covered by our $100k asset protection guarantee.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      {/* Footer */}
      <footer className="relative w-full border-t border-stone-200 bg-[#F7F7F5] dark:bg-slate-950 mt-xxl">
        <div className="tonal-shift bg-[#F2F0E9] dark:bg-slate-900 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto px-8 py-16">
            <div className="col-span-1 md:col-span-1">
              <div className="text-lg font-black text-[#0F3D3E] dark:text-white mb-6">GETYOURCAVE</div>
              <p className="font-manrope text-xs leading-relaxed text-stone-500 dark:text-stone-400">Architectural Serenity for High-Value Assets. Redefining how we preserve what matters most.</p>
            </div>
            <div>
              <h5 className="font-bold text-primary mb-6">Explore</h5>
              <ul className="space-y-4 font-manrope text-xs text-stone-500">
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">About</a>
                </li>
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">Careers</a>
                </li>
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">Help Center</a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-primary mb-6">Safety</h5>
              <ul className="space-y-4 font-manrope text-xs text-stone-500">
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">Security</a>
                </li>
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">Insurance</a>
                </li>
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">Verified Owners</a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-primary mb-6">Legal</h5>
              <ul className="space-y-4 font-manrope text-xs text-stone-500">
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">Privacy Policy</a>
                </li>
                <li>
                  <a className="hover:underline decoration-[#A7C4A0] underline-offset-4 transition-opacity" href="#">Terms</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-8 border-t border-stone-200/50">
          <p className="font-manrope text-xs text-stone-400 text-center">© 2024 GETYOURCAVE. Architectural Serenity for High-Value Assets.</p>
        </div>
      </footer>
      </div>
    </>
  );
}
