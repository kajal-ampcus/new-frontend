import { createFileRoute } from "@tanstack/react-router";
import { Download, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { KitchenLayout } from "./kitchen";

export const Route = createFileRoute("/kitchen-history")({ component: KitchenHistory });

function KitchenHistory() {
  const rows = [
    { id: "#ORD-9621", emp: "John Simmons", initials: "JS", color: "from-amber-500 to-amber-700", station: "Station 04", items: ["Wagyu Burger Set", "Truffle Fries"], price: "$24.00", time: "14:22:15" },
    { id: "#ORD-9620", emp: "Alice Wong", initials: "AW", color: "from-purple-500 to-purple-700", station: "Station 04", items: ["Caesar Salad", "Iced Tea"], price: "$22.50", time: "14:18:42" },
    { id: "#ORD-9619", emp: "Robert K.", initials: "RK", color: "from-rose-500 to-rose-700", station: "Station 03", items: ["Spaghetti Carbonara", "Tiramisu"], price: "$42.00", time: "14:05:01" },
    { id: "#ORD-9613", emp: "Dana Miller", initials: "DM", color: "from-emerald-500 to-emerald-700", station: "Station 04", items: ["Mushroom Risotto"], price: "$27.00", time: "13:58:20" },
    { id: "#ORD-9610", emp: "Tom Brady", initials: "TB", color: "from-sky-500 to-sky-700", station: "Station 02", items: ["Double Pepperoni Pizza"], price: "$18.95", time: "13:45:12" },
  ];

  return (
    <KitchenLayout title="Order History">
      {/* Filters + KPI */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="mb-1 text-[10px] tracking-widest text-muted-foreground">DATE RANGE</div>
            <select className="w-full rounded-md bg-input/60 px-3 py-1.5 text-xs">
              <option>Last 24 Hours</option><option>Last 7 Days</option>
            </select>
          </div>
          <div className="flex-1">
            <div className="mb-1 text-[10px] tracking-widest text-muted-foreground">STATION</div>
            <select className="w-full rounded-md bg-input/60 px-3 py-1.5 text-xs">
              <option>Station 04</option><option>All Stations</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-[10px] tracking-widest text-muted-foreground">EXPORT</div>
            <button className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] tracking-widest text-muted-foreground">TOTAL ORDERS</div>
          <div className="mt-2 text-3xl font-bold text-primary">482</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] tracking-widest text-muted-foreground">REVENUE</div>
          <div className="mt-2 text-3xl font-bold text-primary">$5.2k</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/20 to-primary/5 p-4">
          <div className="text-[10px] tracking-widest text-muted-foreground">EFFICIENCY RATING</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold">98.4%</span>
            <span className="flex items-center gap-1 text-xs text-success"><TrendingUp className="h-3 w-3" />+1.2%</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Average prep time: 6m 12s</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="divide-y divide-border md:hidden">
          {rows.map((r) => (
            <div key={r.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-primary">{r.id}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${r.color} text-[10px] font-bold text-white`}>{r.initials}</div>
                    <span className="text-sm font-semibold">{r.emp}</span>
                  </div>
                </div>
                <span className="rounded bg-info/20 px-2 py-0.5 text-[10px] font-bold text-info">COLLECTED</span>
              </div>
              <div className="text-xs text-muted-foreground">{r.station}</div>
              <div className="flex flex-wrap gap-1">
                {r.items.map((i) => (
                  <span key={i} className="rounded bg-muted px-2 py-0.5 text-[10px]">{i}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">{r.time}</span>
                <span className="font-semibold text-primary">{r.price}</span>
              </div>
            </div>
          ))}
        </div>
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-[10px] tracking-wider text-muted-foreground">
              <th className="px-4 py-3">ORDER ID</th>
              <th className="px-4 py-3">EMPLOYEE NAME</th>
              <th className="px-4 py-3">STATION</th>
              <th className="px-4 py-3">ITEMS</th>
              <th className="px-4 py-3">TOTAL PRICE</th>
              <th className="px-4 py-3">COMPLETION TIME</th>
              <th className="px-4 py-3">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-xs text-primary">{r.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${r.color} text-[10px] font-bold text-white`}>{r.initials}</div>
                    <span className="text-xs">{r.emp}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.station}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.items.map((i) => (
                      <span key={i} className="rounded bg-muted px-2 py-0.5 text-[10px]">{i}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-primary">{r.price}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.time}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-info/20 px-2 py-0.5 text-[10px] font-bold text-info">● COLLECTED</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col gap-2 border-t border-border p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">Showing 1-5 of 482 orders</span>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button className="rounded p-1 hover:bg-muted"><ChevronLeft className="h-3 w-3" /></button>
            {[1, 2, 3].map((n) => (
              <button key={n} className={`h-7 w-7 rounded text-xs ${n === 1 ? "bg-primary font-bold text-primary-foreground" : "hover:bg-muted"}`}>{n}</button>
            ))}
            <span className="px-1 text-muted-foreground">…</span>
            <button className="h-7 w-7 rounded text-xs hover:bg-muted">97</button>
            <button className="rounded p-1 hover:bg-muted"><ChevronRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    </KitchenLayout>
  );
}
