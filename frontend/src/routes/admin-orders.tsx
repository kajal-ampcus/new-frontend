import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  LayoutGrid, ChefHat, Clock3, ReceiptText, Flame,
  Search, LogOut, ShoppingBag, User, Megaphone, ShoppingCart
} from "lucide-react";
import type { ReactNode } from "react";
import { logout, getCurrentUser } from "@/lib/auth";
import { BottomNav, type BottomNavItem } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore, updateOrderStatus, formatINR, type OrderStatus } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-orders")({ component: AdminOrders });

const adminNav: BottomNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, color: "bg-gradient-to-br from-violet-400 to-indigo-600" },
  { to: "/admin-orders", label: "Orders", icon: ShoppingBag, color: "bg-gradient-to-br from-sky-400 to-blue-700" },
  { to: "/admin-counter", label: "Counter", icon: ShoppingCart },
  { to: "/admin-guest-orders", label: "Guest Orders", icon: User, color: "bg-gradient-to-br from-emerald-400 to-teal-600" },
  { to: "/admin-slots", label: "Slots", icon: Clock3, color: "bg-gradient-to-br from-cyan-300 to-sky-700" },
  { to: "/admin-menu", label: "Menu", icon: ChefHat, color: "bg-gradient-to-br from-orange-300 to-red-500" },
  { to: "/admin-announcements", label: "Announcement", icon: Megaphone, color: "bg-gradient-to-br from-fuchsia-400 to-pink-600" },
  { to: "/admin-billing", label: "Reports", icon: ReceiptText, color: "bg-gradient-to-br from-amber-300 to-orange-600" },
  { to: "/admin-notifications", label: "Alerts", icon: Flame, color: "bg-gradient-to-br from-rose-400 to-red-700" },
];

export function AdminLayout({ children, crumb }: { children: ReactNode; crumb: string }) {
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
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-primary leading-tight">Admin Portal</div>
            <div className="text-[10px] text-muted-foreground">Admin / <span className="text-foreground">{crumb}</span></div>
          </div>
        </div>
        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search..." className="w-full rounded-md bg-input/60 py-1.5 pl-9 pr-3 text-sm outline-none" />
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-amber-700" />
          <div className="hidden text-xs sm:block">
            <div className="font-semibold leading-none">{user?.name ?? "Admin"}</div>
            <div className="text-[10px] text-muted-foreground">ADMIN</div>
          </div>
        </div>
        <ThemeToggle />
        <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive" aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </button>
      </header>
      <main className="w-full flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8">{children}</main>
      <BottomNav items={adminNav} />
    </div>
  );
}

const STAGES = ["Pending", "Preparing", "Ready", "Delivered"] as const;
type Stage = typeof STAGES[number];

function AdminOrders() {
  const orders = useStore((s) => s.orders);
  const [slotFilter, setSlotFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | Stage>("All");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const liveOrders = useMemo(
    () => orders.filter((o) => o.status !== "Completed" && o.status !== "Cancelled"),
    [orders],
  );

  const counts = useMemo(() => ({
    Pending: liveOrders.filter((o) => o.status === "Pending").length,
    Preparing: liveOrders.filter((o) => o.status === "Preparing").length,
    Ready: liveOrders.filter((o) => o.status === "Ready").length,
    Delivered: liveOrders.filter((o) => o.status === "Delivered").length,
    Total: liveOrders.length,
  }), [liveOrders]);

  const visible = useMemo(() => {
    let list = liveOrders;
    if (slotFilter !== "All") list = list.filter((o) => o.slot === slotFilter);
    if (statusFilter !== "All") list = list.filter((o) => o.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [liveOrders, slotFilter, statusFilter, query]);

  const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = visible.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [slotFilter, statusFilter, query]);


  const stageStyle = (s: OrderStatus) =>
    s === "Pending" ? "bg-muted text-foreground" :
      s === "Preparing" ? "bg-warning/20 text-warning" :
        s === "Ready" ? "bg-info/20 text-info" :
          s === "Delivered" ? "bg-success/20 text-success" :
            "bg-destructive/20 text-destructive";

  return (
    <AdminLayout crumb="Live Orders">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Live Orders</h1>
          <p className="text-xs text-muted-foreground">Auto-confirmed. Hover a row to see items.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order # or name..."
            className="w-full rounded-md border border-border bg-input/40 py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary sm:w-64"
          />
        </div>
      </div>

      <div className="my-4 grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Stat label="TOTAL" value={counts.Total} color="text-primary" />
        <Stat label="PENDING" value={counts.Pending} color="text-foreground" />
        <Stat label="PREPARING" value={counts.Preparing} color="text-warning" />
        <Stat label="READY" value={counts.Ready} color="text-info" />
        <Stat label="DELIVERED" value={counts.Delivered} color="text-success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1 text-xs">
          <span className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">Slot:</span>
          {["All", "Breakfast", "Lunch", "Dinner"].map((slot) => (
            <button
              key={slot}
              onClick={() => setSlotFilter(slot)}
              className={`rounded px-3 py-1.5 transition ${slotFilter === slot ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1 text-xs">
          <span className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">Status:</span>
          {(["All", ...STAGES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={`rounded px-3 py-1.5 transition ${statusFilter === t ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-[120px_1fr_120px_140px_120px] gap-3 border-b border-border bg-muted/30 px-4 py-2 text-[10px] font-bold tracking-widest text-muted-foreground md:grid">
          <span>ORDER #</span>
          <span>CUSTOMER</span>
          <span>SLOT</span>
          <span>TOTAL</span>
          <span>STATUS</span>
        </div>

        {visible.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No live orders.</div>
        )}

        {paginatedOrders.map((o) => {
          return (
            <div
              key={o.id}
              className="group relative grid grid-cols-2 gap-2 border-b border-border/40 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-muted/30 md:grid-cols-[120px_1fr_120px_140px_120px] md:gap-3 md:items-center"
            >
              <div className="font-mono text-xs text-primary md:text-sm">#{o.orderNumber}</div>
              <div className="col-span-2 md:col-span-1">
                <div className="font-semibold">{o.customerName}</div>
                <div className="text-[10px] text-muted-foreground">{o.department}</div>
              </div>
              <div className="text-xs text-muted-foreground">{o.slot}</div>
              <div className="font-semibold">{formatINR(o.total)}</div>
              <div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${stageStyle(o.status)}`}>● {o.status}</span>
              </div>

              <div className="col-span-2 rounded-lg bg-muted/30 p-2 md:hidden">
                <div className="mb-1 text-[10px] font-bold tracking-widest text-muted-foreground">ITEMS</div>
                <ul className="space-y-1">
                  {o.items.map((it) => (
                    <li key={it.itemId + it.name} className="flex items-center justify-between text-xs">
                      <span>
                        <span className="font-semibold text-primary">×{it.qty}</span> {it.name}
                      </span>
                      <span className="text-muted-foreground">{formatINR(it.price * it.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hover popover with item details */}
              <div className="pointer-events-none absolute left-4 right-4 top-full z-20 mt-1 origin-top scale-95 rounded-lg border border-border bg-popover p-3 opacity-0 shadow-2xl transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 md:left-auto md:right-4 md:w-72">
                <div className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground">ITEMS ORDERED</div>
                <ul className="space-y-1">
                  {o.items.map((it) => (
                    <li key={it.itemId + it.name} className="flex items-center justify-between text-xs">
                      <span>
                        <span className="font-semibold text-primary">×{it.qty}</span>{" "}
                        {it.name}
                      </span>
                      <span className="text-muted-foreground">{formatINR(it.price * it.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-xs font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatINR(o.total)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, visible.length)} of {visible.length} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-md px-3 py-1 text-xs ${currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{String(value).padStart(2, "0")}</div>
    </div>
  );
}
