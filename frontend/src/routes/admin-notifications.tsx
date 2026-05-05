import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, ShoppingBag, Users, Wallet, Trash2, Check } from "lucide-react";
import { AdminLayout } from "./admin-orders";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-notifications")({ component: AdminNotifications });

function AdminNotifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, icon: AlertTriangle, color: "text-destructive bg-destructive/15", title: "Stock running low: Paneer", desc: "Only 2kg remaining for tomorrow's lunch slot.", time: "5 min ago", tag: "URGENT", read: false },
    { id: 2, icon: ShoppingBag, color: "text-primary bg-primary/15", title: "New bulk order received", desc: "Engineering department placed 45 lunch orders.", time: "12 min ago", tag: "ORDER", read: false },
    { id: 3, icon: Users, color: "text-info bg-info/15", title: "New kitchen staff onboarded", desc: "Rajesh Kumar has joined as Junior Chef.", time: "1 hour ago", tag: "USERS", read: false },
    { id: 4, icon: Wallet, color: "text-success bg-success/15", title: "Monthly billing processed", desc: "₹1.2L deducted across 1,240 employees successfully.", time: "3 hours ago", tag: "FINANCE", read: true },
    { id: 5, icon: CheckCircle2, color: "text-success bg-success/15", title: "Reconciliation completed", desc: "All October transactions have been matched.", time: "Yesterday", tag: "FINANCE", read: true },
    { id: 6, icon: Info, color: "text-warning bg-warning/15", title: "Slot capacity warning", desc: "Lunch slot is at 95% capacity for tomorrow.", time: "Yesterday", tag: "SYSTEM", read: true },
  ]);

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.read;
    return true;
  });

  return (
    <AdminLayout crumb="Notifications">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-xs text-muted-foreground">System alerts and operational updates</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={markAllAsRead}
            disabled={notifications.length === 0 || unreadCount === 0}
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            Mark all as read
          </button>
          <button 
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="rounded-md bg-destructive text-destructive-foreground px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-destructive/90 transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Clear all
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {["All", "Unread"].map((filter) => (
          <button 
            key={filter} 
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-3 py-1 transition-colors ${
              activeFilter === filter 
                ? "bg-primary text-primary-foreground" 
                : "border border-border hover:bg-muted"
            }`}
          >
            {filter} ({filter === "All" ? notifications.length : unreadCount})
          </button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Check className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">All clear!</h3>
          <p className="text-sm text-muted-foreground mb-4">You have no notifications at the moment.</p>
          <div className="text-xs text-muted-foreground">
            <Bell className="mr-1 inline h-3 w-3" />
            We'll notify you when something important comes up
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          {filteredNotifications.map((n) => (
            <div key={n.id} className={`flex flex-col gap-3 border-b border-border/40 p-4 last:border-0 hover:bg-muted/20 sm:flex-row sm:items-start ${!n.read ? 'bg-primary/5' : ''}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${n.color}`}><n.icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{n.title}</div>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-muted-foreground">{n.tag}</span>
                  {!n.read && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary-foreground">NEW</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{n.desc}</div>
              </div>
              <div className="shrink-0 text-[10px] text-muted-foreground">{n.time}</div>
            </div>
          ))}
        </div>
      )}

      {filteredNotifications.length === 0 ? null : (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Bell className="h-3 w-3" /> You're all caught up
        </div>
      )}
    </AdminLayout>
  );
}
