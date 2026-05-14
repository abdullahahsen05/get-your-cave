"use client";

export default function BrowseStoragePage() {
  return (
      <div className="bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed min-h-screen">
        {/* TopAppBar Navigation */}
                {/* Level 1: Dominant Search Bar */}
        <section className="mt-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-white border border-outline-variant/40 rounded-xl px-2 py-2 flex flex-wrap md:flex-nowrap items-center gap-2 shadow-[0_10px_40px_-10px_rgba(0,38,39,0.12)]">
            <div className="flex items-center flex-1 min-w-[200px] pl-6 h-14">
              <span
                className="material-symbols-outlined text-primary-container/60 mr-3"
                data-icon="location_on"
              >
                location_on
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Where do you need storage?"
                type="text"
              />
            </div>
            <div className="hidden md:block w-px h-8 bg-outline-variant/30 mx-2"></div>
            <div className="flex items-center flex-1 min-w-[150px] px-4 h-14">
              <span
                className="material-symbols-outlined text-primary-container/60 mr-3"
                data-icon="straighten"
              >
                straighten
              </span>
              <select className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface appearance-none cursor-pointer">
                <option>Any Size</option>
                <option>Small (5x5 ft)</option>
                <option>Medium (10x10 ft)</option>
                <option>Large (20x20 ft)</option>
              </select>
            </div>
            <div className="hidden md:block w-px h-8 bg-outline-variant/30 mx-2"></div>
            <div className="flex items-center flex-1 min-w-[150px] px-4 h-14">
              <span
                className="material-symbols-outlined text-primary-container/60 mr-3"
                data-icon="calendar_month"
              >
                calendar_month
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Move-in date"
                type="text"
              />
            </div>
            <button className="bg-primary text-white h-14 px-8 rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-primary-container active:scale-95 shadow-md">
              <span className="material-symbols-outlined" data-icon="search">
                search
              </span>
              <span className="font-bold">Search</span>
            </button>
          </div>
        </section>
        {/* Level 2: Results & Filter Header */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-outline-variant/20 pb-6">
          <div>
            <h2 className="font-h1 text-h2 text-primary-container flex items-center gap-3">
              128 Storage Caves
              <span className="text-body-sm font-normal text-on-surface-variant px-3 py-1 bg-surface-container rounded-full italic-emphasis">
                Greater San Francisco Area
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <button className="flex items-center gap-2 text-primary font-bold text-body-sm hover:underline">
              <span
                className="material-symbols-outlined text-[20px]"
                data-icon="map"
              >
                map
              </span>
              Show Map
            </button>
            <div className="flex items-center gap-2">
              <span className="text-label-caps text-on-surface-variant">
                Sort by:
              </span>
              <select className="bg-transparent border-none focus:ring-0 font-bold text-body-sm text-primary appearance-none cursor-pointer pr-4">
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Size: Largest</option>
              </select>
            </div>
          </div>
        </section>
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row gap-gutter">
          {/* Level 4: Sidebar Filters */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-10">
            <div className="bg-surface-container-low/40 p-6 rounded-lg border border-outline-variant/20 lg:sticky lg:top-24">
              <h3 className="font-label-caps text-label-caps text-primary mb-6 tracking-widest uppercase">
                Refine Search
              </h3>
              {/* Price Range */}
              <div className="mb-8 pb-8 border-b border-outline-variant/20">
                <label className="font-bold text-[13px] text-on-surface mb-5 block">
                  Price Range (Monthly)
                </label>
                <div className="relative w-full h-1 bg-surface-container-high rounded-full mt-4 mb-3">
                  <div className="absolute h-full w-2/3 bg-secondary rounded-full left-1/4"></div>
                  <div className="absolute -top-1.5 left-1/4 w-4 h-4 bg-primary rounded-full shadow-md border-2 border-white"></div>
                  <div className="absolute -top-1.5 left-[91%] w-4 h-4 bg-primary rounded-full shadow-md border-2 border-white"></div>
                </div>
                <div className="flex justify-between text-[13px] font-semibold text-on-surface-variant">
                  <span>$50</span>
                  <span>$1,200+</span>
                </div>
              </div>
              {/* Unit Size */}
              <div className="mb-8 pb-8 border-b border-outline-variant/20">
                <label className="font-bold text-[13px] text-on-surface mb-5 block">
                  Unit Size
                </label>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-fixed transition-colors"
                      type="checkbox"
                    />
                    <span className="text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      Small (up to 50 sq ft)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      defaultChecked
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-fixed transition-colors"
                      type="checkbox"
                    />
                    <span className="text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      Medium (50 - 150 sq ft)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-fixed transition-colors"
                      type="checkbox"
                    />
                    <span className="text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      Large (150 - 300 sq ft)
                    </span>
                  </label>
                </div>
              </div>
              {/* Storage Type */}
              <div className="mb-8 pb-8 border-b border-outline-variant/20">
                <label className="font-bold text-[13px] text-on-surface mb-5 block">
                  Storage Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-1.5 rounded-full border-2 border-primary text-primary font-bold text-[11px] uppercase tracking-wider bg-primary/5">
                    Garage
                  </button>
                  <button className="px-4 py-1.5 rounded-full border border-outline-variant/40 text-on-surface-variant font-medium text-[11px] uppercase tracking-wider hover:border-primary transition-all">
                    Loft
                  </button>
                  <button className="px-4 py-1.5 rounded-full border border-outline-variant/40 text-on-surface-variant font-medium text-[11px] uppercase tracking-wider hover:border-primary transition-all">
                    Warehouse
                  </button>
                  <button className="px-4 py-1.5 rounded-full border border-outline-variant/40 text-on-surface-variant font-medium text-[11px] uppercase tracking-wider hover:border-primary transition-all">
                    Basement
                  </button>
                </div>
              </div>
              {/* Distance */}
              <div className="mb-4">
                <label className="font-bold text-[13px] text-on-surface mb-5 block">
                  Distance
                </label>
                <select className="w-full bg-white border border-outline-variant/30 rounded-lg p-2.5 text-body-sm focus:border-primary focus:ring-0">
                  <option>Within 5 miles</option>
                  <option value="Within 10 miles">Within 10 miles</option>
                  <option>Within 25 miles</option>
                </select>
              </div>
            </div>
          </aside>
          {/* Level 3: Listing Grid (Strict 3-column) */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 */}
              <article className="group bg-white rounded-lg overflow-hidden border border-outline-variant/20 card-shadow card-hover transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlVrURlNSg8iNTE9GnvU2o749hEm4jvya_479eNJNEJuNxUGk326cH62rq6vsHGIFdviZFAypKjio5NUT03Qde9CSstZbrXPTmlKWG5wAQXy2y_QCA_kqlFlF_vcVS98caXI4B4kRi4DoOhBWRb2qYlkcfa3xAmA8yDRyWth2RqopXRtvlioOa2xgHDPpQG-r1SkjwF0mKLtPF9EJNSTtHYx9-svR9yNa0_kEEsgIncvy-Cg56WpW2T-MPs2_P_MISm2CjJCiFwTo"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-secondary text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      Garage
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-[16px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="text-xs font-bold text-primary">4.9</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-h3 text-h3 text-primary leading-tight mb-1">
                    The Heights Private Cave
                  </h4>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-6">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      data-icon="location_on"
                    >
                      location_on
                    </span>
                    Pacific Heights, SF
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20 mt-auto">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="square_foot"
                      >
                        square_foot
                      </span>
                      120 sq ft
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="lock"
                      >
                        lock
                      </span>
                      Secured
                    </div>
                    <div className="ml-auto text-right">
                      <span className="font-extrabold text-primary text-body-lg">
                        $240
                      </span>
                      <span className="text-on-surface-variant font-medium text-xs">
                        /mo
                      </span>
                    </div>
                  </div>
                </div>
              </article>
              {/* Card 2 */}
              <article className="group bg-white rounded-lg overflow-hidden border border-outline-variant/20 card-shadow card-hover transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDw84qwg0THJU2cauzlq0hxSGVCgZDgertD0b0qnmJPBQEajr3Na7dufLLtuwponbZvNuvOdX6a39dv25rCydPEGYH3-QHDJuy1apGLeqvUjgKa4fMzEUvGUXZsefr-lhBwZdSPm7qWZOFWjca3P28NBg_1E9C1wSIBQuIQlXerhqpHtxVQqZfI_iXhhgkib47CJQgW9Vz2zOquncqC_ht8JBoJ09Vpw_UP7EFUKomySxMXMVQBqfP_c8iDgWFYnZbL0l2blyNV10E"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-secondary text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      Loft
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-[16px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="text-xs font-bold text-primary">5.0</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-h3 text-h3 text-primary leading-tight mb-1">
                    Mission District Studio
                  </h4>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-6">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      data-icon="location_on"
                    >
                      location_on
                    </span>
                    Mission St, SF
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20 mt-auto">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="square_foot"
                      >
                        square_foot
                      </span>
                      85 sq ft
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="thermostat"
                      >
                        thermostat
                      </span>
                      Climate
                    </div>
                    <div className="ml-auto text-right">
                      <span className="font-extrabold text-primary text-body-lg">
                        $185
                      </span>
                      <span className="text-on-surface-variant font-medium text-xs">
                        /mo
                      </span>
                    </div>
                  </div>
                </div>
              </article>
              {/* Card 3 */}
              <article className="group bg-white rounded-lg overflow-hidden border border-outline-variant/20 card-shadow card-hover transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7fb8InKvLc3zUDR5NGmnt7jEr0yX3_Vn364WGCdYkS7JeB3ouKzmy_vTSMNKDOBnEmFHbAN1OBsx8_Jwg2gkDVv1gPtuDshnP808GgPmjgD1aSHNOxsApyIsMyBb3EC_VvlCty7O_bNJ-hZKA8d_etiruKYkH9MMMkcwq0Gn1qrl1idHSVUUQOo5IV22GQNMBN2Wc1V3vC4RtZuKkforSnpagbLoCUTUEA5l83G-AEYGNaUIzeCgKQl5TcS5jShmj8Hq_ulWw7qE"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-secondary text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      Warehouse
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-[16px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="text-xs font-bold text-primary">4.8</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-h3 text-h3 text-primary leading-tight mb-1">
                    Presidio Tech Vault
                  </h4>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-6">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      data-icon="location_on"
                    >
                      location_on
                    </span>
                    Presidio, SF
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20 mt-auto">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="square_foot"
                      >
                        square_foot
                      </span>
                      300 sq ft
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="camera_indoor"
                      >
                        camera_indoor
                      </span>
                      CCTV
                    </div>
                    <div className="ml-auto text-right">
                      <span className="font-extrabold text-primary text-body-lg">
                        $410
                      </span>
                      <span className="text-on-surface-variant font-medium text-xs">
                        /mo
                      </span>
                    </div>
                  </div>
                </div>
              </article>
              {/* Card 4 */}
              <article className="group bg-white rounded-lg overflow-hidden border border-outline-variant/20 card-shadow card-hover transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEMzWCKTMW9myHE10w7l7ipIN-rMkLrVcUnbwBYq2ox_sZt3uy0tPn09J1wKbn815LUaVdKfKyWW3UMBq0KDvdAL1VheQetC6yVh-o8PF0A4o9qNlKLqJ57L0aYlP8cpfbuXAquCPUDAIoXu9Heh4txqVmX5yvphIEPPjxiayU07yHfC_D8CI7CBBB1UD2na5hNtuvtmSsyvyC4moLz8IoYfKij4qgZg24GClZxmB43gCKImnlbdBeW06oOQmwKqWvaaLR194ykFQ"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-secondary text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      Basement
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-[16px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="text-xs font-bold text-primary">4.7</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-h3 text-h3 text-primary leading-tight mb-1">
                    Marina Serene Unit
                  </h4>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-6">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      data-icon="location_on"
                    >
                      location_on
                    </span>
                    Marina Dist, SF
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20 mt-auto">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="square_foot"
                      >
                        square_foot
                      </span>
                      45 sq ft
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        data-icon="verified"
                      >
                        verified
                      </span>
                      Verified
                    </div>
                    <div className="ml-auto text-right">
                      <span className="font-extrabold text-primary text-body-lg">
                        $115
                      </span>
                      <span className="text-on-surface-variant font-medium text-xs">
                        /mo
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
            {/* Level 5: Enhanced Pagination */}
            <div className="py-20 flex justify-center">
              <nav className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant hover:text-primary transition-all bg-white shadow-sm">
                  <span
                    className="material-symbols-outlined"
                    data-icon="chevron_left"
                  >
                    chevron_left
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <button className="w-12 h-12 rounded-full bg-primary text-white font-extrabold text-body-md shadow-lg shadow-primary/20">
                    1
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant transition-all font-bold">
                    2
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant transition-all font-bold">
                    3
                  </button>
                  <span className="px-2 text-outline-variant">...</span>
                  <button className="w-12 h-12 rounded-full bg-white border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant transition-all font-bold">
                    12
                  </button>
                </div>
                <button className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant hover:text-primary transition-all bg-white shadow-sm">
                  <span
                    className="material-symbols-outlined"
                    data-icon="chevron_right"
                  >
                    chevron_right
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </main>
        {/* Footer */}
                {/* BottomNavBar (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 md:hidden bg-white/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[32px]">
          <a
            className="flex flex-col items-center justify-center text-primary bg-primary/5 rounded-full px-5 py-1.5"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="search">
              search
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold">
              Explore
            </span>
          </a>
          <a
            className="flex flex-col items-center justify-center text-on-surface-variant/50"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="favorite">
              favorite
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold">
              Saved
            </span>
          </a>
          <a
            className="flex flex-col items-center justify-center text-on-surface-variant/50"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="person">
              person
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold">
              Profile
            </span>
          </a>
        </nav>
      </div>
  );
}
