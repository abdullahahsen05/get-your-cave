"use client";

export default function ListingDetailPageDittoStyledFixed() {
  return (
      <div className="bg-background text-on-surface font-body-md selection:bg-secondary-container">
      {/* TopNavBar */}
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
                <p>Located in the heart of Chelsea&apos;s gallery district, The Emerald Vault offers a sanctuary for high-value items, from fine art collections to vintage furniture and sensitive tech equipment.</p>
                <p>This 120 sq ft unit features pristine, museum-grade white walls and industrial-strength concrete flooring. The &quot;cave&quot; is situated on the second floor of a private, gated facility with specialized freight elevator access. Designed for those who prioritize architectural serenity and absolute peace of mind.</p>
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
                  <p className="text-body-md text-on-surface-variant italic-emphasis">Julian&apos;s space is impeccable. I stored my entire ceramics collection here for six months and everything remained in perfect condition. Truly a &apos;cave&apos; for the soul.</p>
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
                  <p className="text-sm font-medium">10&apos; x 12&apos; Studio</p>
                </div>
              </div>
              <button className="w-full bg-primary text-white py-4 rounded-full font-bold text-body-lg mb-lg scale-100 hover:opacity-95 active:scale-95 transition-all">Book Now</button>
              <p className="text-center text-body-sm text-on-surface-variant italic-emphasis mb-lg">You won&apos;t be charged yet</p>
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
            </div>
  );
}
