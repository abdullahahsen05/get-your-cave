"use client";

import Image from "next/image";

const navLinks = ["Home", "Browse Storage", "How it Works"];

const ownerMenu = [
  {
    title: "List & Earn",
    items: [
      ["deployed_code", "Why List Your Space"],
      ["monitoring", "Earning Potential"],
      ["star", "Success Stories"],
      ["add_box", "Owner Benefits"],
    ],
  },
  {
    title: "Resources",
    items: [
      ["menu_book", "Owner Guide"],
      ["verified_user", "Safety & Security"],
      ["sell", "Pricing & Fees"],
      ["support_agent", "Help Center"],
    ],
  },
  {
    title: "Tools",
    items: [
      ["dashboard", "Dashboard Overview"],
      ["payments", "Payouts & Payments"],
      ["description", "Contracts & Docs"],
      ["task_alt", "Verification Process"],
    ],
  },
];

const stats = [
  {
    label: "Total Users",
    icon: "group",
    value: "12,482",
    note: "+12% from last month",
  },
  {
    label: "Active Listings",
    icon: "garage",
    value: "3,904",
    note: "98.2% occupancy rate",
  },
  {
    label: "Monthly Revenue",
    icon: "payments",
    value: "$412,890",
    note: "+5.4% organic growth",
  },
];

const chartHeights = [40, 45, 38, 52, 60, 58, 75, 68, 72, 85, 92, 88];

const activities = [
  {
    name: "Alexander Thorne",
    id: "USR-88219",
    type: "User",
    typeClass: "bg-[#4b6547]/10 text-[#516b4d]",
    status: "Verified",
    statusDot: "bg-[#4b6547]",
    date: "Oct 24, 2023",
  },
  {
    name: "Suburban Haven Vault",
    id: "LST-4492",
    type: "Listing",
    typeClass: "bg-[#0f3d3e]/10 text-[#0f3d3e]",
    status: "Pending",
    statusDot: "bg-amber-500",
    date: "Oct 23, 2023",
  },
  {
    name: "Elena Rodriguez",
    id: "USR-90112",
    type: "User",
    typeClass: "bg-[#4b6547]/10 text-[#516b4d]",
    status: "Verified",
    statusDot: "bg-[#4b6547]",
    date: "Oct 22, 2023",
  },
];

export default function AdminDashboardPage() {
  return (
      <div className="min-h-screen bg-[#fcf9f8] font-['Manrope',sans-serif] text-[#1c1b1b] antialiased">
        
        <main className="mx-auto max-w-[1440px] space-y-8 px-4 sm:px-6 lg:px-12 pb-20 pt-24 sm:pt-28 lg:pt-32 lg:space-y-12">
          <div className="mb-10 flex flex-col gap-2">
            <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold leading-[1.1] text-[#0F3D3E]">Admin Dashboard</h1>
            <p className="font-medium text-stone-500">
              Overview of the network&apos;s current performance and recent growth.
            </p>
          </div>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase leading-none tracking-[0.05em] text-[#404848]">
                    {item.label}
                  </p>
                  <span className="material-symbols-outlined text-[#4b6547]">{item.icon}</span>
                </div>
                <h2 className="text-[36px] font-bold leading-[1.2] tracking-[-0.01em] text-[#0f3d3e]">
                  {item.value}
                </h2>
                <p className="mt-2 text-sm font-medium italic leading-[1.5] text-[#4b6547]">
                  <span className="inline-flex items-center">{item.note}</span>
                </p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12 lg:col-span-2">
              <div className="mb-8 lg:mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">Revenue Performance</h3>
                <div className="flex gap-2">
                  <span className="rounded-full border border-[#c0c8c8] bg-white px-3 py-1 text-sm leading-[1.5]">
                    7 Days
                  </span>
                  <span className="rounded-full bg-[#0f3d3e] px-3 py-1 text-sm leading-[1.5] text-white">
                    30 Days
                  </span>
                </div>
              </div>

              <div className="relative flex h-[300px] w-full items-end justify-between px-2">
                <div className="absolute inset-0 flex flex-col justify-between border-b border-l border-[#c0c8c8]/30 py-2">
                  {[0, 1, 2, 3].map((line) => (
                    <div key={line} className="w-full border-t border-[#c0c8c8]/10" />
                  ))}
                </div>
                <div className="relative flex h-full w-full items-end gap-1 pt-8">
                  {chartHeights.map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className={`w-full rounded-t-sm ${
                        index === 6 || index === 10
                          ? "bg-[#0f3d3e] shadow-sm"
                          : index === 4 || index === 11
                            ? "bg-[#4b6547]/30"
                            : index === 2 || index === 5 || index === 7 || index === 9
                              ? "bg-[#4b6547]/20"
                              : "bg-[#4b6547]/10"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-between text-xs font-semibold uppercase leading-none tracking-[0.05em] text-[#404848]">
                <span>Week 01</span>
                <span>Week 02</span>
                <span>Week 03</span>
                <span>Week 04</span>
              </div>
            </div>

            <div className="tonal-card flex flex-col justify-between rounded-[2rem] border border-[#EBEBE8] p-12">
              <div>
                <h3 className="mb-4 text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">Market Insights</h3>
                <p className="text-base leading-relaxed text-[#404848]">
                  Demand for climate-controlled{" "}
                  <span className="italic text-[#0f3d3e]">Premium Vaults</span> has increased by 18% in the
                  urban sector.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  ["New York City", "+24%"],
                  ["Los Angeles", "+16%"],
                ].map(([city, growth]) => (
                  <div
                    key={city}
                    className="flex items-center justify-between rounded-2xl border border-[#EBEBE8] bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#4b6547]">trending_up</span>
                      <span className="text-sm font-semibold leading-[1.5]">{city}</span>
                    </div>
                    <span className="text-sm font-bold leading-[1.5] text-[#4b6547]">{growth}</span>
                  </div>
                ))}
              </div>

              <div className="relative mt-6 h-32 overflow-hidden rounded-2xl">
                <Image
                  className="object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  alt="A modern secure vault interior with metallic shelving and warm lighting"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_YtGckwCAF5jPF35RYc4KOHUT0z2d6ulxPxdkA7_4u-RwluFdcBHRvJXFFJoC3j8i721euohBmLX1Kac40KRFUsldZvxCa01FCJ_XsoF06Y7uJcybYMWE_nj4qY47fACUgkQH29gm7sOw-44q7pt5nBuBvYwdbdgr_jKVoTHHFYDZKirOgo6FbmmSLnodjHP2fbQ4nNFZ8owi0wxa2ZrqkQqPWMlab5aCLZS26Tub55gQr5PM3FK8bo4u70iUYqgjJ7T4A_Sw5_Q"
                  fill
                  unoptimized
                />
              </div>
            </div>
          </section>

          <section className="tonal-card overflow-hidden rounded-[2rem] border border-[#EBEBE8]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EBEBE8] px-4 sm:px-6 lg:px-12 py-6">
              <h2 className="text-[28px] font-bold leading-[1.3] text-[#0f3d3e]">Recent Activity</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#404848]">
                    search
                  </span>
                  <input
                    className="w-64 rounded-full border border-[#EBEBE8] bg-white py-2 pl-10 pr-4 text-sm leading-[1.5] focus:border-[#4b6547] focus:ring-0"
                    placeholder="Filter activity..."
                    type="text"
                  />
                </div>
                <button className="material-symbols-outlined rounded-full p-2 text-[#404848] transition-colors hover:bg-white">
                  filter_list
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f6f3f2]">
                  <tr>
                    {["Name / ID", "Type", "Status", "Date"].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 sm:px-6 lg:px-12 py-4 text-xs font-semibold uppercase leading-none tracking-[0.05em] text-[#404848]"
                      >
                        {heading}
                      </th>
                    ))}
                    <th className="px-4 sm:px-6 lg:px-12 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBE8]">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="transition-colors hover:bg-white/50">
                      <td className="px-4 sm:px-6 lg:px-12 py-4">
                        <div className="flex flex-col">
                          <span className="text-base font-bold leading-[1.6] text-[#0f3d3e]">{activity.name}</span>
                          <span className="text-sm leading-[1.5] text-[#404848]">{activity.id}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 lg:px-12 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${activity.typeClass}`}>
                          {activity.type}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 lg:px-12 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${activity.statusDot}`} />
                          <span className="text-sm font-medium leading-[1.5]">{activity.status}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 lg:px-12 py-4 text-sm leading-[1.5] text-[#404848]">{activity.date}</td>
                      <td className="px-4 sm:px-6 lg:px-12 py-4 text-right">
                        <button className="material-symbols-outlined text-[#404848] hover:text-[#0f3d3e]">
                          more_horiz
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#EBEBE8] bg-white px-12 py-4">
              <span className="text-sm leading-[1.5] text-[#404848]">Showing 3 of 482 activities</span>
              <div className="flex items-center gap-2">
                <button className="rounded p-1 opacity-30 hover:bg-stone-100" disabled>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="rounded p-1 hover:bg-stone-100">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </main>

              </div>
  );
}
