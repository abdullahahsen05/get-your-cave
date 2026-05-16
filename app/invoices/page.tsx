export default function InvoicesPage() {
  return (
    <main className="min-h-screen bg-background text-on-background pt-32 pb-32 mx-auto max-w-[1200px] px-6">
      <section className="mb-12">
        <h1 className="font-h1 text-h1 text-primary">Invoices</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
          Manage your architectural storage payments and history.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-low p-12 rounded-lg border border-outline-variant shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 block">
            TOTAL INVOICED
          </span>
          <div className="flex items-end justify-between">
            <span className="font-h1 text-h1 text-primary">$12,450.00</span>
            <span className="material-symbols-outlined text-primary mb-2">
              account_balance_wallet
            </span>
          </div>
        </div>

        <div className="bg-secondary-container/20 p-12 rounded-lg border border-secondary-fixed shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
          <span className="font-label-caps text-label-caps text-secondary mb-2 block">
            PAID
          </span>
          <div className="flex items-end justify-between">
            <span className="font-h1 text-h1 text-primary">$11,200.00</span>
            <span className="material-symbols-outlined text-secondary mb-2">
              check_circle
            </span>
          </div>
        </div>

        <div className="bg-error-container/20 p-12 rounded-lg border border-error-container shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
          <span className="font-label-caps text-label-caps text-error mb-2 block">
            OUTSTANDING
          </span>
          <div className="flex items-end justify-between">
            <span className="font-h1 text-h1 text-primary">$1,250.00</span>
            <span className="material-symbols-outlined text-error mb-2">
              pending_actions
            </span>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest p-4 rounded-lg border border-surface-variant mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <select className="w-full bg-surface-container-low border-b border-outline rounded-none px-4 py-2 font-body-sm text-body-sm focus:outline-none appearance-none">
              <option>All Statuses</option>
              <option>Paid</option>
              <option>Issued</option>
              <option>Draft</option>
              <option>Cancelled</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-on-surface-variant">
              expand_more
            </span>
          </div>

          <div className="relative w-full md:w-64">
            <input
              className="w-full bg-surface-container-low border-b border-outline rounded-none px-4 py-2 font-body-sm text-body-sm focus:outline-none"
              placeholder="Jan 2024 - Dec 2024"
              type="text"
            />
            <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-on-surface-variant">
              calendar_month
            </span>
          </div>
        </div>
        <button className="w-full md:w-auto bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps">
          Apply Filters
        </button>
      </section>

      <section className="overflow-x-auto bg-surface rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-variant">
              <th className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Invoice #
              </th>
              <th className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Booking
              </th>
              <th className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Issued Date
              </th>
              <th className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">
                Amount
              </th>
              <th className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Status
              </th>
              <th className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            <tr className="hover:bg-surface-container-low transition-colors">
              <td className="py-6 px-4 font-body-md font-bold text-primary">
                INV-8821
              </td>
              <td className="py-6 px-4 font-body-sm text-on-surface">
                The High-Ceiling Vault, Zurich
              </td>
              <td className="py-6 px-4 font-body-sm text-on-surface-variant">
                Oct 12, 2024
              </td>
              <td className="py-6 px-4 font-body-md font-bold text-right text-primary">
                $450.00
              </td>
              <td className="py-6 px-4">
                <span className="bg-secondary-container/20 text-on-secondary-container px-2 py-1 rounded-full font-label-caps text-[10px] uppercase border border-secondary-container">
                  Paid
                </span>
              </td>
              <td className="py-6 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className="p-1 text-primary hover:bg-primary-fixed rounded-full transition-colors"
                    title="View"
                    type="button"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button
                    className="p-1 text-primary hover:bg-primary-fixed rounded-full transition-colors"
                    title="Download"
                    type="button"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr className="hover:bg-surface-container-low transition-colors">
              <td className="py-6 px-4 font-body-md font-bold text-primary">
                INV-8904
              </td>
              <td className="py-6 px-4 font-body-sm text-on-surface">
                Climate Controlled Atelier, Berlin
              </td>
              <td className="py-6 px-4 font-body-sm text-on-surface-variant">
                Nov 01, 2024
              </td>
              <td className="py-6 px-4 font-body-md font-bold text-right text-primary">
                $800.00
              </td>
              <td className="py-6 px-4">
                <span className="bg-primary-fixed/30 text-primary px-2 py-1 rounded-full font-label-caps text-[10px] uppercase border border-primary-fixed">
                  Issued
                </span>
              </td>
              <td className="py-6 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className="p-1 text-primary hover:bg-primary-fixed rounded-full transition-colors"
                    title="View"
                    type="button"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button
                    className="p-1 text-primary hover:bg-primary-fixed rounded-full transition-colors"
                    title="Pay"
                    type="button"
                  >
                    <span className="material-symbols-outlined">payments</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr className="hover:bg-surface-container-low transition-colors">
              <td className="py-6 px-4 font-body-md font-bold text-primary">
                INV-9120
              </td>
              <td className="py-6 px-4 font-body-sm text-on-surface">
                Private Marble Chamber, Milan
              </td>
              <td className="py-6 px-4 font-body-sm text-on-surface-variant">
                Nov 15, 2024
              </td>
              <td className="py-6 px-4 font-body-md font-bold text-right text-primary">
                $1,250.00
              </td>
              <td className="py-6 px-4">
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-full font-label-caps text-[10px] uppercase border border-outline-variant">
                  Draft
                </span>
              </td>
              <td className="py-6 px-4 text-right">
                <div className="flex justify-end gap-2 opacity-50 cursor-not-allowed">
                  <button
                    className="p-1 text-on-surface-variant"
                    disabled
                    type="button"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button
                    className="p-1 text-on-surface-variant"
                    disabled
                    type="button"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-32 bg-surface-container-lowest border border-surface-variant rounded-lg p-12 shadow-[0_4px_20px_rgba(15,61,62,0.04)] relative">
        <div className="absolute top-4 right-4">
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors" type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start border-b border-surface-variant pb-6 mb-12">
          <div>
            <h2 className="font-h2 text-h2 text-primary">Invoice #INV-8821</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Booking: The High-Ceiling Vault, Zurich
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-left md:text-right">
            <span className="bg-secondary-container text-on-secondary-container px-6 py-1 rounded-full font-label-caps text-label-caps uppercase">
              Paid
            </span>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Issued: October 12, 2024
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Paid: October 14, 2024
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
              FROM
            </p>
            <p className="font-body-md font-bold text-primary">GETYOURCAVE AG</p>
            <p className="font-body-sm text-on-surface-variant">
              Bahnhofstrasse 12
              <br />
              8001 Zurich, Switzerland
              <br />
              VAT: CHE-123.456.789
            </p>
          </div>

          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
              TO
            </p>
            <p className="font-body-md font-bold text-primary">Julian Henderson</p>
            <p className="font-body-sm text-on-surface-variant">
              Rue de la Paix 24
              <br />
              1202 Geneva, Switzerland
            </p>
          </div>
        </div>

        <div className="mb-12">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-4">
            ITEMIZED BREAKDOWN
          </p>
          <div className="border border-outline-variant rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container">
                <tr>
                  <th className="py-2 px-4 font-label-caps text-label-caps">
                    Description
                  </th>
                  <th className="py-2 px-4 font-label-caps text-label-caps text-right">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                <tr>
                  <td className="py-4 px-4 font-body-sm">
                    Monthly Rent - High-Ceiling Vault (October)
                  </td>
                  <td className="py-4 px-4 font-body-md text-right">$380.00</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-body-sm">
                    Premium Security &amp; Insurance Add-on
                  </td>
                  <td className="py-4 px-4 font-body-md text-right">$70.00</td>
                </tr>
                <tr className="bg-surface-container-low font-bold">
                  <td className="py-4 px-4 font-body-md text-primary">Total</td>
                  <td className="py-4 px-4 font-body-md text-right text-primary">
                    $450.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button className="px-12 py-4 border border-primary text-primary rounded-full font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors">
            Download PDF
          </button>
          <button className="px-12 py-4 bg-primary text-on-primary rounded-full font-label-caps text-label-caps hover:opacity-90 transition-opacity">
            Pay Now
          </button>
        </div>
      </section>
    </main>
  );
}
