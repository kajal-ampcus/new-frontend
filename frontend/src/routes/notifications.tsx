import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import {
  Check,
  Wallet,
  AlertTriangle,
  Info,
  UtensilsCrossed,
  Bell,
  BellOff,
  Trash2,
  Clock,
  Gift,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useStore, formatINR, getActiveOrder } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({ component: Notifications });

type NotificationType = "order" | "wallet" | "system" | "promo";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: Date;
  read: boolean;
  actionable?: boolean;
  actionText?: string;
  actionRoute?: string;
}

function Notifications() {
  const navigate = useNavigate();
  const orders = useStore((s) => s.orders);
  const walletBalance = useStore((s) => s.walletBalance);
  const activeOrder = getActiveOrder();
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setMounted(true);

    // Generate dynamic notifications based on actual data
    const dynamicNotifications: Notification[] = [];

    // Active order notification
    if (activeOrder) {
      dynamicNotifications.push({
        id: "active-order",
        type: "order",
        title: activeOrder.status === "Ready" ? "Order Ready for Pickup!" : `Order ${activeOrder.status}`,
        body:
          activeOrder.status === "Ready"
            ? `Your order ${activeOrder.orderNumber} (${activeOrder.items.map((i) => i.name).join(", ")}) is ready! Please collect from the counter.`
            : `Your order ${activeOrder.orderNumber} is currently being ${activeOrder.status.toLowerCase()}. We'll notify you when it's ready.`,
        time: new Date(activeOrder.createdAt),
        read: false,
        actionable: true,
        actionText: "View Order",
        actionRoute: "/orders",
      });
    }

    // Recent completed orders
    const recentCompleted = orders
      .filter((o) => o.status === "Completed" || o.status === "Delivered")
      .slice(0, 2);

    recentCompleted.forEach((order, i) => {
      dynamicNotifications.push({
        id: `completed-${order.id}`,
        type: "order",
        title: "Order Delivered",
        body: `Your order ${order.orderNumber} has been successfully delivered. Total: ${formatINR(order.total)}. Enjoy your meal!`,
        time: new Date(new Date(order.createdAt).getTime() + 30 * 60000),
        read: true,
      });
    });

    // Wallet notification
    dynamicNotifications.push({
      id: "wallet-balance",
      type: "wallet",
      title: walletBalance < 500 ? "Low Wallet Balance" : "Wallet Balance Update",
      body:
        walletBalance < 500
          ? `Your wallet balance is low (${formatINR(walletBalance)}). Add funds to continue ordering without interruption.`
          : `Your current wallet balance is ${formatINR(walletBalance)}. You're all set for your next meal!`,
      time: new Date(Date.now() - 60 * 60000),
      read: walletBalance >= 500,
      actionable: walletBalance < 500,
      actionText: "Add Funds",
      actionRoute: "/wallet",
    });

    // System notifications
    dynamicNotifications.push({
      id: "system-1",
      type: "system",
      title: "New Menu Items Available",
      body: "Check out our new additions! Fresh seasonal items have been added to the lunch menu. Don't miss the Chef's Special dishes.",
      time: new Date(Date.now() - 3 * 60 * 60000),
      read: false,
      actionable: true,
      actionText: "Browse Menu",
      actionRoute: "/menu",
    });

    // Promo notification
    dynamicNotifications.push({
      id: "promo-1",
      type: "promo",
      title: "Weekend Special Offer!",
      body: "Get 20% off on all orders above ₹500 this weekend. Use code: WEEKEND20 at checkout. Valid until Sunday midnight.",
      time: new Date(Date.now() - 5 * 60 * 60000),
      read: true,
    });

    dynamicNotifications.push({
      id: "system-2",
      type: "system",
      title: "Ordering Hours Extended",
      body: "Great news! Dinner slot ordering hours have been extended till 10:00 PM. Now you have more time to place your orders.",
      time: new Date(Date.now() - 24 * 60 * 60000),
      read: true,
    });

    setNotifications(dynamicNotifications.sort((a, b) => b.time.getTime() - a.time.getTime()));
  }, [orders, walletBalance, activeOrder]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "read") return n.read;
    if (filter === "unread") return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification removed");
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "order":
        return UtensilsCrossed;
      case "wallet":
        return Wallet;
      case "system":
        return Info;
      case "promo":
        return Gift;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case "order":
        return "bg-primary/15 text-primary";
      case "wallet":
        return "bg-success/15 text-success";
      case "system":
        return "bg-info/15 text-info";
      case "promo":
        return "bg-warning/15 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filters = [
    { value: "all" as const, label: "All", count: notifications.length },
    { value: "read" as const, label: "Read", count: notifications.filter((n) => n.read).length },
    { value: "unread" as const, label: "Unread", count: notifications.filter((n) => !n.read).length },
  ];

  return (
    <AppLayout title="Notifications">
      <div className={`space-y-6 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay updated with your orders and promotions
            </p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Check className="h-4 w-4" />
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 text-sm font-medium text-destructive hover:underline"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                filter === f.value
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "border border-border bg-card hover:bg-muted"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === f.value ? "bg-white/20" : "bg-muted"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BellOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">No notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const Icon = getIcon(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg ${
                    notification.read ? "border-border" : "border-primary/30 bg-primary/5"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  )}

                  <div className="flex gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getIconColor(notification.type)}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeAgo(notification.time)}
                        </div>
                      </div>

                      <p className="mt-1.5 text-sm text-muted-foreground">{notification.body}</p>

                      {notification.actionable && (
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => notification.actionRoute && navigate({ to: notification.actionRoute })}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:shadow-primary/40"
                          >
                            {notification.actionText}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="flex justify-center">
            <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-muted">
              Load Older Notifications
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
