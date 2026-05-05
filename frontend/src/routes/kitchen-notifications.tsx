import { createFileRoute } from "@tanstack/react-router";
import {
  ShoppingBag, AlertTriangle, RefreshCw, Package, AlertOctagon, Filter, CheckCheck,
} from "lucide-react";
import { KitchenLayout } from "./kitchen";

export const Route = createFileRoute("/kitchen-notifications")({ component: KitchenNotifications });

function KitchenNotifications() {
  const list = [
    { icon: ShoppingBag, color: "bg-primary/20 text-primary", type: "New Order", msg: "New Order Received #ORD-9621", sub: "Table 12 — 2× Truffle Fries, 1× Caesar Salad", time: "2 mins ago", status: "Active", statusColor: "bg-destructive text-destructive-foreground" },
    { icon: AlertTriangle, color: "bg-warning/20 text-warning", type: "Warning", msg: "Order Delay Warning #ORD-9584", sub: "Prep time exceeded standard window — escalation required.", time: "12 mins ago", status: "Active", statusColor: "bg-warning text-foreground" },
    { icon: RefreshCw, color: "bg-info/20 text-info", type: "Update", msg: "Order Modify for Pickup #ORD-9583", sub: "Add: 1x soy sauce side dish", time: "45 mins ago", status: "Resolved", statusColor: "bg-info/30 text-info" },
    { icon: Package, color: "bg-emerald-500/20 text-emerald-400", type: "New Order", msg: "New Order Received #ORD-9582", sub: "Pickup — Vegan Burger Set Meal", time: "55 mins ago", status: "Resolved", statusColor: "bg-info/30 text-info" },
    { icon: AlertOctagon, color: "bg-destructive/20 text-destructive", type: "Critical", msg: "Order Ready for Pickup #ORD-9581", sub: "Customer waiting at counter — confirm handoff.", time: "1h 0m ago", status: "Resolved", statusColor: "bg-info/30 text-info" },
  ];

  return (
    <KitchenLayout title="Notifications">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications Center</h1>
          <p className="text-xs text-muted-foreground">Managing real-time updates from across the kitchen operations.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs"><Filter className="h-3 w-3" /> Filter Alerts</button>
          <button className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><CheckCheck className="h-3 w-3" /> Mark All Resolved</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-[1fr_2.5fr_1fr_0.8fr] border-b border-border px-4 py-2 text-[10px] tracking-wider text-muted-foreground md:grid">
          <span>TYPE</span><span>MESSAGE</span><span>TIME</span><span>STATUS</span>
        </div>
        {list.map((n, i) => (
          <div key={i} className="grid items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0 md:grid-cols-[1fr_2.5fr_1fr_0.8fr] md:items-center">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-md ${n.color}`}><n.icon className="h-3.5 w-3.5" /></div>
              <span className="text-xs font-semibold">{n.type}</span>
            </div>
            <div>
              <div className="text-xs font-semibold">{n.msg}</div>
              <div className="text-[10px] text-muted-foreground">{n.sub}</div>
            </div>
            <div className="text-xs text-muted-foreground md:text-left">{n.time}</div>
            <div><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${n.statusColor}`}>{n.status}</span></div>
          </div>
        ))}
        <div className="flex items-center justify-between p-3 text-xs text-muted-foreground">
          <span>Showing 5 of 12 alerts</span>
          <div className="flex gap-1">
            <button className="rounded border border-border px-2 py-0.5">‹</button>
            <button className="rounded border border-border px-2 py-0.5">›</button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-warning/20 text-warning"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground">Active Alerts</div>
              <div className="text-2xl font-bold">02</div>
              <div className="text-[10px] text-muted-foreground">Currently requiring action</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success/20 text-success"><CheckCheck className="h-5 w-5" /></div>
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground">Shift Efficiency</div>
              <div className="text-2xl font-bold">94%</div>
              <div className="text-[10px] text-muted-foreground">Resolved alerts in this shift</div>
            </div>
          </div>
        </div>
      </div>
    </KitchenLayout>
  );
}
