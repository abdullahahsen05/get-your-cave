export default function ContractsPage() {
  return (
    <main className="min-h-screen bg-background text-on-background pt-32 pb-32 mx-auto max-w-[1200px] px-6">
      <style>{`
        .pdf-preview-canvas {
          background-image:
            linear-gradient(45deg, #f0eded 25%, transparent 25%),
            linear-gradient(-45deg, #f0eded 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0eded 75%),
            linear-gradient(-45deg, transparent 75%, #f0eded 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>

      <header className="mb-12">
        <h1 className="font-h1 text-h1 text-primary">Your Contracts</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
          Manage your secure storage agreements and legal documentation.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Filter by Status:
              </span>
              <select className="bg-surface border-none rounded-full px-6 py-1 font-body-sm text-body-sm text-on-surface ring-1 ring-outline-variant focus:ring-primary transition-shadow">
                <option>All Statuses</option>
                <option>Draft</option>
                <option>Sent</option>
                <option>Signed</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Sort:
              </span>
              <select className="bg-surface border-none rounded-full px-6 py-1 font-body-sm text-body-sm text-on-surface ring-1 ring-outline-variant focus:ring-primary transition-shadow">
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Amount High-Low</option>
              </select>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 overflow-x-auto shadow-[0_4px_20px_rgba(15,61,62,0.02)]">
            <table className="w-full min-w-[780px] text-left border-collapse">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                    Booking
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                    Type
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                    Status
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                    Signed Date
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/20">
                <tr className="bg-primary/5 border-l-4 border-l-primary">
                  <td className="px-6 py-4">
                    <div className="font-h3 text-body-md text-primary">
                      The Obsidian Vault
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      ID: BK-77429
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary-container/50 text-on-secondary-container px-2 py-1 rounded font-label-caps text-[10px]">
                      PREMIUM
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full font-label-caps text-[11px]">
                      SENT
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">
                    —
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary font-label-caps text-label-caps hover:underline" type="button">
                      View Contract
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-h3 text-body-md text-on-surface">
                      Alpine Climate Cell
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      ID: BK-22108
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-1 rounded font-label-caps text-[10px]">
                      STANDARD
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary-fixed text-on-primary-fixed-variant px-4 py-1 rounded-full font-label-caps text-[11px]">
                      SIGNED
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">
                    Oct 12, 2023
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary font-label-caps text-label-caps hover:underline" type="button">
                      View Contract
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-h3 text-body-md text-on-surface">
                      Minimalist Loft Space
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      ID: BK-99831
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-1 rounded font-label-caps text-[10px]">
                      FLEX
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-surface-container-highest text-on-surface-variant px-4 py-1 rounded-full font-label-caps text-[11px]">
                      DRAFT
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">
                    —
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary font-label-caps text-label-caps hover:underline" type="button">
                      View Contract
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-h3 text-body-md text-on-surface">
                      Heritage Archives C02
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      ID: BK-44102
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary-container/50 text-on-secondary-container px-2 py-1 rounded font-label-caps text-[10px]">
                      PREMIUM
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-error-container text-on-error-container px-4 py-1 rounded-full font-label-caps text-[11px]">
                      CANCELLED
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">
                    —
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary font-label-caps text-label-caps hover:underline" type="button">
                      View Contract
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <section className="lg:sticky lg:top-32 bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-[0_8px_40px_rgba(15,61,62,0.06)] overflow-hidden">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-start gap-4">
              <div>
                <h2 className="font-h2 text-h2 text-primary">
                  The Obsidian Vault
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Contract Document #LGL-2024-V4
                </p>
              </div>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" type="button">
                close
              </button>
            </div>

            <div className="bg-surface-container-high h-[500px] flex items-center justify-center relative overflow-hidden">
              <div className="pdf-preview-canvas absolute inset-0 opacity-40" />

              <div className="relative z-10 w-4/5 h-[400px] bg-white shadow-xl rounded-sm p-12 flex flex-col gap-4">
                <div className="h-10 bg-surface-container w-2/3 rounded-sm" />

                <div className="space-y-2">
                  <div className="h-4 bg-surface-container-low w-full rounded-sm" />
                  <div className="h-4 bg-surface-container-low w-full rounded-sm" />
                  <div className="h-4 bg-surface-container-low w-5/6 rounded-sm" />
                </div>

                <div className="mt-auto flex justify-between border-t border-outline-variant pt-6">
                  <div className="w-24 h-12 bg-surface-container-low rounded-sm" />
                  <div className="w-24 h-12 bg-surface-container-low rounded-sm" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                  <div className="bg-primary/90 text-on-primary px-6 py-4 rounded-full font-label-caps text-label-caps flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined">zoom_in</span>
                    Fullscreen Preview
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase tracking-widest text-[10px]">
                Contract Timeline
              </h3>

              <div className="relative space-y-4">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-outline-variant" />

                <div className="flex items-start gap-4 relative">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-[14px] text-on-secondary fill-icon">
                      check
                    </span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface leading-none">
                      Contract Generated
                    </p>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Jan 14, 2024 • 10:45 AM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-[14px] text-on-secondary fill-icon">
                      check
                    </span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface leading-none">
                      Sent to Parties
                    </p>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Jan 14, 2024 • 11:02 AM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-[14px] text-on-secondary fill-icon">
                      check
                    </span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface leading-none">
                      Owner Signed
                    </p>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Jan 15, 2024 • 09:30 AM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-5 h-5 rounded-full bg-surface border-2 border-primary flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-primary font-bold leading-none">
                      Renter Signed
                    </p>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Awaiting your signature...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-lowest">
              <button className="bg-primary text-on-primary py-4 rounded-full font-label-caps text-label-caps flex items-center justify-center gap-2 active:scale-95 transition-all" type="button">
                <span className="material-symbols-outlined text-[20px]">draw</span>
                Sign Now
              </button>
              <button className="bg-surface border border-outline-variant text-primary py-4 rounded-full font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-surface-container transition-colors" type="button">
                <span className="material-symbols-outlined text-[20px]">
                  download
                </span>
                Download PDF
              </button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
