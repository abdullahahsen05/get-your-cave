import { getCurrentUser } from "@/lib/auth";
import { getRenterBookings } from "@/lib/bookings";

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RenterDashboardPage() {
  const currentUser = await getCurrentUser();
  const renterBookings =
    currentUser?.role === "RENTER" && currentUser.renterProfile
      ? await getRenterBookings(currentUser.renterProfile.id)
      : [];

  const activeBookings = renterBookings.filter((booking) =>
    ["APPROVED", "ACTIVE"].includes(booking.status),
  );
  const pendingBookings = renterBookings.filter(
    (booking) => booking.status === "PENDING",
  );
  const completedBookings = renterBookings.filter(
    (booking) => booking.status === "COMPLETED",
  );
  const nextBooking = activeBookings[0] ?? pendingBookings[0] ?? null;

  const activeUnitCount = activeBookings.length;
  const totalSavedSqFt = activeBookings.reduce((total, booking) => {
    return total + (booking.listing.sizeSqFt ?? 0);
  }, 0);
  const nextPaymentLabel = nextBooking
    ? formatFullDate(nextBooking.startDate)
    : "Pending";

  const rentalCards = activeBookings.slice(0, 2);
  const rentalFallback = [
    {
      title: "The Heights Private Cave",
      address: "1200 Westview Pkwy, Suite 4",
      price: "$240",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDWM-9MgAPyfeNpm1vYVnyQPnCPNknpt-po1Xo8qiYb-ZzJe6XWiWoGeuUsyAbiK51-AqV55ILO2VD60LqMS4SArs2AUgojkzhNoneSVrKm6YQT4DgZ9YEfHqFGB7zK6r3UxqnirhPeYwVMckkGLNgnL0tbobxeodsGf2j700CN0GAkmHSt4fWA8bnh6eTnKFZ4i8JLSuU8W7-PQZb_iVQy68T3rzd0Xfsi7Wb2OLg065z_Qm_xV8S6YX6YWA_PitVPSfB6CREmXdk",
    },
    {
      title: "Downtown Micro-Cell",
      address: "45 Market St, Vault B",
      price: "$185",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA6RKOFNy5SmNhy6h7RiPdwTKdwfYQurLvsGz2IqI3B8v-sDUZ8BkjT88XSBkGjK4CPQZoXzUq-aLXWb7uDOMGy0T0cme0uei_eidg3ut7e5xWqjy0LDP--wB6VfvXpoKhX5OOYNmSCgVJM3fJ8MDcHpNOkmE0fXtew8RkDB1DedW3IDEdlkaV_NOAoxuNU_0vX1pFflDQ4Ef9YGBavpHbWLyMNBb6aqw9pqbe6fTPSO-6miTH4OP00GTb-FN-194X9z0q7mVQVxOg",
    },
  ];

  const invoiceRows =
    renterBookings.length > 0
      ? renterBookings.slice(0, 3).map((booking) => ({
          id: booking.bookingNumber,
          listing: booking.listing.title,
          amount: formatCurrency(booking.totalMonthlyAmount),
          status:
            booking.status === "PENDING"
              ? "Pending"
              : booking.status === "APPROVED"
                ? "Approved"
                : booking.status === "ACTIVE"
                  ? "Active"
                  : booking.status === "REJECTED"
                    ? "Rejected"
                    : booking.status === "CANCELLED"
                      ? "Cancelled"
                      : "Completed",
          date: formatFullDate(booking.createdAt),
        }))
      : [
          { id: "#INV-8824", listing: "The Heights Private Cave", amount: "$240.00", status: "Paid", date: "Oct 15, 2024" },
          { id: "#INV-8712", listing: "Downtown Micro-Cell", amount: "$185.00", status: "Paid", date: "Oct 01, 2024" },
        ];

  return (
    <main className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed antialiased max-w-[1200px] mx-auto px-8 pt-32 pb-24">
      <header className="mb-12">
        <h1 className="font-h1 text-h1 text-primary mb-2">
          Welcome back {currentUser?.fullName ?? "Julian"}
        </h1>
        <p className="font-body-md text-body-md text-outline">
          You have {activeUnitCount} active rentals and {pendingBookings.length} message
          {pendingBookings.length === 1 ? "" : "s"} waiting for your response.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
          <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
            Active Units
          </p>
          <p className="font-h2 text-h2 text-primary">{activeUnitCount}</p>
          <div className="mt-4 w-full bg-surface-container h-1.5 rounded-full">
            <div
              className="bg-secondary-fixed-dim h-full rounded-full"
              style={{ width: `${Math.min(100, activeUnitCount * 33)}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
          <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
            Next Payment
          </p>
          <p className="font-h2 text-h2 text-primary">{nextPaymentLabel}</p>
          <p className="text-body-sm font-body-sm text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">event</span>
            Auto-pay enabled
          </p>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
          <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
            Total Saved
          </p>
          <p className="font-h2 text-h2 text-primary">
            {`${totalSavedSqFt} sq ft`}
          </p>
          <p className="text-body-sm font-body-sm text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Verified capacity
          </p>
        </div>
      </section>

      <section className="mb-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="font-h2 text-h2 text-primary">Active Rentals</h2>
          <a
            className="text-body-sm font-body-sm text-primary font-bold hover:underline underline-offset-4"
            href="#"
          >
            View All
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {rentalCards.length
            ? rentalCards.map((booking) => (
                <article
                  className="group bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] transition-all hover:translate-y-[-4px]"
                  key={booking.id}
                >
                  <div className="h-64 relative overflow-hidden">
                    <img
                      alt={booking.listing.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={
                        booking.listing.imageUrl ??
                        rentalFallback[0].image
                      }
                    />
                    <span className="absolute top-4 left-4 bg-[#CDEBC5] text-[#092009] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {booking.status === "ACTIVE" ? "Active" : "Approved"}
                    </span>
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6 gap-4">
                      <div>
                        <h3 className="font-h3 text-h3 text-primary mb-1">
                          {booking.listing.title}
                        </h3>
                        <p className="font-body-sm text-body-sm text-outline">
                          {booking.listing.address}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-h3 text-h3 text-primary">
                          {formatCurrency(booking.monthlyPrice)}
                        </p>
                        <p className="font-body-sm text-body-sm text-outline">/mo</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        className="flex-1 bg-primary-container text-on-primary py-3 rounded-full text-sm font-bold hover:opacity-95 transition-opacity"
                        type="button"
                      >
                        Manage Unit
                      </button>
                      <button
                        className="w-12 h-12 flex items-center justify-center border border-[#EBEBE8] rounded-full hover:bg-surface-container transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            : rentalFallback.map((item) => (
                <article
                  className="group bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] transition-all hover:translate-y-[-4px]"
                  key={item.title}
                >
                  <div className="h-64 relative overflow-hidden">
                    <img
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={item.image}
                    />
                    <span className="absolute top-4 left-4 bg-[#CDEBC5] text-[#092009] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6 gap-4">
                      <div>
                        <h3 className="font-h3 text-h3 text-primary mb-1">
                          {item.title}
                        </h3>
                        <p className="font-body-sm text-body-sm text-outline">
                          {item.address}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-h3 text-h3 text-primary">{item.price}</p>
                        <p className="font-body-sm text-body-sm text-outline">/mo</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        className="flex-1 bg-primary-container text-on-primary py-3 rounded-full text-sm font-bold hover:opacity-95 transition-opacity"
                        type="button"
                      >
                        Manage Unit
                      </button>
                      <button
                        className="w-12 h-12 flex items-center justify-center border border-[#EBEBE8] rounded-full hover:bg-surface-container transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="flex justify-between items-end mb-8 gap-4">
          <h2 className="font-h2 text-h2 text-primary">Payment &amp; Invoices</h2>
          <a
            className="text-body-sm font-body-sm text-primary font-bold hover:underline underline-offset-4"
            href="#"
          >
            View All Invoices
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              Total Paid YTD
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatCurrency(
                renterBookings.reduce(
                  (total, booking) => total + Number(booking.totalMonthlyAmount),
                  0,
                ) || 3245,
              )}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              Outstanding
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatCurrency(
                pendingBookings.reduce(
                  (total, booking) => total + Number(booking.totalMonthlyAmount),
                  0,
                ) || 0,
              )}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              Last Payment
            </p>
            <p className="font-h2 text-h2 text-primary">
              {completedBookings[0]
                ? formatFullDate(completedBookings[0].updatedAt)
                : "Oct 15, 2024"}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#EBEBE8] bg-surface-container-low">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    Invoice #
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    Listing
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    Amount
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EBEBE8]">
                {invoiceRows.map((row) => (
                  <tr className="hover:bg-surface-container-low transition-colors" key={row.id}>
                    <td className="px-6 py-4 font-body-sm text-primary">
                      {row.id}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-primary">
                      {row.listing}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-primary font-semibold">
                      {row.amount}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {row.status}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-outline">
                      {row.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-h2 text-h2 text-primary mb-8">Past Rentals</h2>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface-container-lowest rounded-lg border border-[#EBEBE8] gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden shrink-0">
                <img
                  alt="Oak Creek Depot"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAJVskKNoaaYMInar5okyo5MGWyiSfatjPPbev9kLABKMZNOq8-UV0u9H09R2G4yWAS2x_MKea2kjydyRUyt45HxmQ_T0put7UC-xA7V1Jud6pqW1LjyugOQGyX4k04eohBptUTYwT4yIWGjB1TyEnfX9fR3KdQog4vJXN3_7KokSp3e-inYDUD6JkG3xyywXj2l2EQ3K6oQXXPRyVuXUj2UYz5KPXc_yxYZzUI3qjkcAZ93nIAAPkQWYGQxVMyfHQvA0nJmyhtGI"
                />
              </div>
              <div>
                <h4 className="font-body-lg text-body-lg text-primary font-bold">
                  Oak Creek Depot
                </h4>
                <p className="font-body-sm text-body-sm text-outline">
                  Jan 2023 - June 2024
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-12">
              <div className="text-right">
                <p className="font-label-caps text-label-caps text-secondary mb-1 uppercase tracking-widest">
                  Completed
                </p>
                <p className="font-body-md text-body-md text-primary font-semibold">
                  $120/mo
                </p>
              </div>
              <button
                className="text-primary-container font-bold hover:underline underline-offset-4 text-sm"
                type="button"
              >
                Download Receipt
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface-container-lowest rounded-lg border border-[#EBEBE8] gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden shrink-0">
                <img
                  alt="Riverside Box"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmoIY2m5gYbLs7-vpNWee8Eq4_OWfmw5EPjVwIUoDsnqHZkAMz9n8FVhGPWHP2B-wxnfNZLgrd5tnNEuqYJZSiCfsb0elheIc3jGaPFz1Wn2PQo8NT9qGQj4pAVsm1C9EClyfdEllRixskgQOZa0KJqHJQxCaxg4dzHNlFueFmonxUmW4ZF_Ctku6JzCZPYIAPHc6La5Ty9cZJ0bi5hknY_9aKtb9acXG23pdS6p0Ap5USMVv2zIYkTQFHIvCq40xNXX5vcYzcjpU"
                />
              </div>
              <div>
                <h4 className="font-body-lg text-body-lg text-primary font-bold">
                  Riverside Box
                </h4>
                <p className="font-body-sm text-body-sm text-outline">
                  Aug 2022 - Dec 2022
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-12">
              <div className="text-right">
                <p className="font-label-caps text-label-caps text-secondary mb-1 uppercase tracking-widest">
                  Completed
                </p>
                <p className="font-body-md text-body-md text-primary font-semibold">
                  $95/mo
                </p>
              </div>
              <button
                className="text-primary-container font-bold hover:underline underline-offset-4 text-sm"
                type="button"
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
