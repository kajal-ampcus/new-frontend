import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChefHat, Clock3, Flame, LogOut, Search, Settings, HelpCircle,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { logout, getCurrentUser } from "@/lib/auth";
import { BottomNav, type BottomNavItem } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/kitchen")({ component: Kitchen });

const kitchenNav: BottomNavItem[] = [
  { to: "/kitchen", label: "Live", icon: ChefHat, color: "bg-gradient-to-br from-orange-300 to-red-500" },
  { to: "/kitchen-history", label: "History", icon: Clock3, color: "bg-gradient-to-br from-cyan-300 to-sky-700" },
  { to: "/kitchen-notifications", label: "Alerts", icon: Flame, color: "bg-gradient-to-br from-rose-400 to-red-700" },
];

export function KitchenLayout({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const user = typeof window !== "undefined" ? getCurrentUser() : null;
  const handleLogout = () => { logout(); navigate({ to: "/login" }); };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/60 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ChefHat className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-sm font-semibold leading-tight">{title}</div>
        </div>
        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search orders, items, or staff..." className="w-full rounded-md bg-input/60 py-1.5 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button className="ml-auto hidden items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground sm:flex">
          <Plus className="h-3 w-3" /> Manual Order
        </button>
        <Settings className="h-4 w-4 text-muted-foreground" />
        <HelpCircle className="hidden h-4 w-4 text-muted-foreground sm:block" />
        <ThemeToggle />
        <span className="rounded bg-emerald-600/20 px-2 py-1 text-[10px] font-bold text-emerald-400">● {user?.name ?? "Chef"}</span>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive" aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </button>
      </header>
      <main className="w-full flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8">{children}</main>
      <BottomNav items={kitchenNav} />
    </div>
  );
}

function Kitchen() {
  const orders = [
    { id: "#ORD-9601", emp: "Jane Diaz", station: "Hot Deli", item: "2x Wagyu Burger, 1x Truffle Fries", time: "04:32", status: "NEW", statusColor: "bg-destructive text-destructive-foreground", action: "Preparing" },
    { id: "#ORD-9598", emp: "Marcus Smets", station: "Salad Bar", item: "1x Quinoa Bowl (Side of Beets)", time: "05:48", status: "PREPARING", statusColor: "bg-primary text-primary-foreground", action: "Ready" },
    { id: "#ORD-9592", emp: "Linda Chen", station: "Beverages", item: "3x Iced Latte, 1x Espresso", time: "12:15", status: "COMPLETED", statusColor: "bg-emerald-600 text-white", action: "Print Receipt" },
    { id: "#ORD-9587", emp: "Tobi Andrej", station: "Hot Deli", item: "1x Ribeye Steak (Medium)", time: "07:30", status: "NEW", statusColor: "bg-destructive text-destructive-foreground", action: "Preparing" },
  ];

  const stations = [
    { name: "Hot Grill", load: "100%", color: "bg-destructive" },
    { name: "Salad Bar", load: "45m", color: "bg-warning" },
    { name: "Beverages", load: "38%", color: "bg-emerald-500" },
    { name: "Oven Station", load: "76m", color: "bg-primary", highlight: true },
  ];

  return (
    <KitchenLayout title="Live Orders · Hot prep window: 8m">
      <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <div className="font-semibold">Live Orders</div>
              <div className="text-xs text-muted-foreground">Monitoring – Active preparation flow</div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-md bg-destructive px-3 py-1 font-semibold text-destructive-foreground">4 URGENT</span>
              <span className="rounded-md bg-muted px-3 py-1 font-semibold">12 TOTAL</span>
            </div>
          </div>
          <div className="divide-y divide-border md:hidden">
            {orders.map((o) => (
              <div key={o.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-primary">{o.id}</div>
                    <div className="mt-1 text-sm font-semibold">{o.emp}</div>
                    <div className="text-xs text-muted-foreground">{o.station}</div>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${o.statusColor}`}>{o.status}</span>
                </div>
                <div className="text-xs">{o.item}</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{o.time}</span>
                  <button className="rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground">
                    {o.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[10px] tracking-wider text-muted-foreground">
                <th className="px-3 py-2">ORDER ID</th>
                <th className="px-3 py-2">EMPLOYEE</th>
                <th className="px-3 py-2">STATION</th>
                <th className="px-3 py-2">ITEMS</th>
                <th className="px-3 py-2">TOTAL TIME</th>
                <th className="px-3 py-2">STATUS</th>
                <th className="px-3 py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-3 text-xs text-primary">{o.id}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-amber-700" />{o.emp}</div></td>
                  <td className="px-3 py-3 text-muted-foreground">{o.station}</td>
                  <td className="px-3 py-3 text-xs">{o.item}</td>
                  <td className="px-3 py-3 font-mono text-xs">{o.time}</td>
                  <td className="px-3 py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${o.statusColor}`}>{o.status}</span></td>
                  <td className="px-3 py-3"><button className="rounded-md bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">{o.action}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] tracking-widest text-muted-foreground">TOTAL PREP TIME</div>
            <div className="text-2xl font-bold text-primary">14:25 <span className="text-xs text-muted-foreground">MINS</span></div>
            <div className="mt-3 text-[10px] tracking-widest text-muted-foreground">CURRENT LOAD</div>
            <div className="mt-1 h-2 rounded-full bg-muted">
              <div className="h-2 w-[84%] rounded-full bg-primary" />
            </div>
            <div className="mt-1 text-xs font-bold">84%</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold">Station Status</div>
            <div className="space-y-2">
              {stations.map((s) => (
                <div key={s.name} className={`flex items-center justify-between rounded-md border p-2 text-xs ${s.highlight ? "border-primary bg-primary/10" : "border-border"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">Active</div>
                    </div>
                  </div>
                  <span className="font-mono">{s.load}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg sm:right-6">
        <Plus className="h-5 w-5" />
      </button>
    </KitchenLayout>
  );
}
