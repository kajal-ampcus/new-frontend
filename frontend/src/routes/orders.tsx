import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Pagination } from "@/components/Pagination";
import {
  Check,
  UtensilsCrossed,
  ShoppingBag,
  Download,
  Plus,
  Clock,
  Package,
  XCircle,
  ChevronRight,
  CalendarDays,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { useStore, formatINR, getMealSlots, downloadCSV, updateOrderStatus, type Order, type OrderStatus } from "@/lib/store";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/orders")({ component: Orders });

type FilterStatus = "All" | "Active" | "Completed" | "Cancelled" | "Custom";

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Changed my mind",
  "Ordered wrong item",
  "Duplicate order",
  "Other reason",
];

function Orders() {
  const navigate = useNavigate();
  const orders = useStore((s) => s.orders);
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [mounted, setMounted] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const mealSlots = getMealSlots();
  const availableSlots = mealSlots.filter(s => s.status !== "expired");
  
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select active slot
  useEffect(() => {
    const currentActive = mealSlots.find((s) => s.status === "active");
    if (currentActive && (!selectedSlotId || mealSlots.find(s => s.id === selectedSlotId)?.status === "expired")) {
      setSelectedSlotId(currentActive.id);
    } else if (!selectedSlotId && availableSlots.length > 0) {
      setSelectedSlotId(availableSlots[0].id);
    }
  }, [mealSlots, selectedSlotId, availableSlots]);

  const selectedSlot = mealSlots.find((s) => s.id === selectedSlotId);

  const activeOrdersForSlot = orders.filter(
    (o) =>
      o.slot === selectedSlot?.name &&
      ["Pending", "Accepted", "Preparing", "Ready"].includes(o.status)
  );

  // Auto-select latest order for the slot
  useEffect(() => {
    if (activeOrdersForSlot.length > 0 && !activeOrdersForSlot.find(o => o.id === selectedOrderId)) {
      setSelectedOrderId(activeOrdersForSlot[0].id);
    } else if (activeOrdersForSlot.length === 0) {
      setSelectedOrderId(null);
    }
  }, [activeOrdersForSlot, selectedOrderId]);

  const activeOrder = activeOrdersForSlot.find((o) => o.id === selectedOrderId);

  const filteredOrders = orders.filter((order) => {
    if (filter === "All") return true;
    if (filter === "Active") return ["Pending", "Accepted", "Preparing", "Ready"].includes(order.status);
    if (filter === "Completed") return ["Completed", "Delivered"].includes(order.status);
    if (filter === "Cancelled") return order.status === "Cancelled";
    if (filter === "Custom") {
      const orderDate = new Date(order.createdAt);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: FilterStatus) => { setFilter(f); setPage(1); };

  const getStatusSteps = (order: Order) => {
    const allSteps: { label: string; icon: typeof Check }[] = [
      { label: "Placed", icon: Receipt },
      { label: "Accepted", icon: Check },
      { label: "Preparing", icon: UtensilsCrossed },
      { label: "Ready", icon: Package },
      { label: "Collected", icon: ShoppingBag },
    ];
    const statusMap: Record<OrderStatus, number> = {
      Pending: 0, Accepted: 1, Preparing: 2, Ready: 3,
      Delivered: 4, Completed: 4, Cancelled: -1,
    };
    const currentIndex = statusMap[order.status];
    return allSteps.map((step, index) => ({
      ...step,
      done: index < currentIndex,
      current: index === currentIndex,
    }));
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Pending": return "bg-warning/15 text-warning";
      case "Accepted": return "bg-info/15 text-info";
      case "Preparing": return "bg-primary/15 text-primary";
      case "Ready": return "bg-success/15 text-success";
      case "Delivered":
      case "Completed": return "bg-success/15 text-success";
      case "Cancelled": return "bg-destructive/15 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const canCancel = (status: OrderStatus) =>
    status === "Pending" || status === "Accepted";

  const formatOrderDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatOrderTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const toInputDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleConfirmExport = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    const exportOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });

    const rows = [
      ["Order ID", "Date", "Slot", "Items", "Total", "Status"],
      ...exportOrders.map((o) => [
        o.orderNumber, formatOrderDate(o.createdAt), o.slot,
        o.items.map((i) => `${i.name} x${i.qty}`).join(", "),
        o.total.toString(), o.status,
      ]),
    ];
    downloadCSV(`orders-export-${dateRange.start}-to-${dateRange.end}.csv`, rows);
    setShowExportModal(false);
  };

  const handleConfirmCancel = () => {
    if (cancelOrderId) {
      updateOrderStatus(cancelOrderId, "Cancelled");
      setCancelOrderId(null);
      setCancelReason(CANCEL_REASONS[0]);
    }
  };

  const cancellingOrder = orders.find((o) => o.id === cancelOrderId);

  const filters: { value: FilterStatus; label: string }[] = [
    { value: "All", label: "All Orders" },
    { value: "Active", label: "Active" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Custom", label: "Custom Range" },
  ];

  return (
    <AppLayout title="Orders">
      <div className={`space-y-6 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track your current orders and view history</p>
          </div>

        </div>

        {/* Active Order Tracker */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              const isActive = slot.status === "active";
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {slot.name}
                  {isActive && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                </button>
              );
            })}
          </div>

          {activeOrdersForSlot.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">👉 No active orders for this slot</p>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-xl bg-muted/30 p-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Order
                </label>
                <select
                  value={selectedOrderId || ""}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full sm:max-w-md rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {activeOrdersForSlot.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} – {o.items.map(i => i.name).join(", ")} – {formatINR(o.total)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Order Card */}
              {activeOrder && (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-orange-500/5 p-6 shadow-lg shadow-primary/5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold">Current Order</h2>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(activeOrder.status)}`}>
                            {activeOrder.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-primary">{activeOrder.orderNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatINR(activeOrder.total)}</p>
                      <p className="text-xs text-muted-foreground">{activeOrder.items.length} items</p>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="mb-5 flex items-center justify-between">
                    {getStatusSteps(activeOrder).map((step, i, arr) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.label} className="flex flex-1 items-center">
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 ${step.current
                                ? "bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-lg shadow-primary/30"
                                : step.done
                                  ? "bg-primary text-white"
                                  : "bg-muted text-muted-foreground"
                                }`}
                            >
                              <StepIcon className={`h-5 w-5 ${step.current ? "animate-pulse" : ""}`} />
                            </div>
                            <span className={`text-xs font-medium ${step.current ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                              {step.label}
                            </span>
                          </div>
                          {i < arr.length - 1 && (
                            <div className={`mx-2 h-1.5 flex-1 rounded-full transition-all duration-500 ${step.done ? "bg-primary" : "bg-muted"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Items */}
                  <div className="rounded-xl bg-card/80 p-4 backdrop-blur">
                    <div className="space-y-2">
                      {activeOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                              {item.qty}x
                            </span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{formatINR(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cancel Button — only for Pending/Accepted */}
                    {canCancel(activeOrder.status) && (
                      <div className="mt-4 border-t border-border pt-4">
                        <button
                          onClick={() => setCancelOrderId(activeOrder.id)}
                          className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 active:scale-95"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Filter Tabs & Export */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar sm:pb-0">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange(f.value)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${filter === f.value
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "border border-border bg-card hover:bg-muted"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>

          {filter === "Custom" && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card/50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">From</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formatOrderDate(dateRange.start)}
                    onClick={(e) => (e.currentTarget.nextSibling as HTMLInputElement).showPicker()}
                    className="w-32 cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="absolute inset-0 opacity-0 pointer-events-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formatOrderDate(dateRange.end)}
                    onClick={(e) => (e.currentTarget.nextSibling as HTMLInputElement).showPicker()}
                    className="w-32 cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="absolute inset-0 opacity-0 pointer-events-none"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing orders between {formatOrderDate(dateRange.start)} and {formatOrderDate(dateRange.end)}
              </p>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h3 className="font-bold">Order History</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{filteredOrders.length} orders found</p>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">No orders found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "All" ? "You haven't placed any orders yet" : `No ${filter.toLowerCase()} orders`}
              </p>
              <button
                onClick={() => navigate({ to: "/menu" })}
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {pagedOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="group flex cursor-pointer items-center gap-4 p-5 transition-colors hover:bg-muted/50"
                  >
                    {/* Order Icon */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${order.status === "Cancelled"
                        ? "bg-destructive/15 text-destructive"
                        : ["Completed", "Delivered"].includes(order.status)
                          ? "bg-success/15 text-success"
                          : "bg-primary/15 text-primary"
                        }`}
                    >
                      {order.status === "Cancelled" ? (
                        <XCircle className="h-5 w-5" />
                      ) : ["Completed", "Delivered"].includes(order.status) ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{order.orderNumber}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {order.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatOrderDate(order.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatOrderTime(order.createdAt)}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5">{order.slot}</span>
                      </div>
                    </div>

                    {/* Amount & Action */}
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-bold">{formatINR(order.total)}</p>
                      {canCancel(order.status) ? (
                        <button
                          onClick={() => setCancelOrderId(order.id)}
                          className="text-xs font-semibold text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          View Details <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filteredOrders.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-32 right-6 z-20">
          <button
            onClick={() => navigate({ to: "/menu" })}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 transition-transform hover:scale-110"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ── */}
      {cancelOrderId && cancellingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setCancelOrderId(null); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            {/* Warning icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>

            <h2 className="text-xl font-bold">Cancel {cancellingOrder.orderNumber}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Cancellation updates everywhere immediately, including the kitchen queue.
            </p>

            {/* Reason dropdown */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setCancelOrderId(null); setCancelReason(CANCEL_REASONS[0]); }}
                className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-white shadow-lg shadow-destructive/30 transition-all hover:bg-destructive/90 active:scale-95"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Export Modal ── */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground">Export Report</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Select date range for the report</p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-0 shadow-2xl overflow-hidden">
            <div className={`p-6 text-white ${getStatusColor(selectedOrder.status).includes("destructive") ? "bg-destructive" : "bg-primary"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Order Details</p>
                  <h2 className="text-2xl font-bold mt-1">{selectedOrder.orderNumber}</h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
                  {selectedOrder.status}
                </span>
                <span className="text-sm font-medium text-white/90">
                  {formatOrderDate(selectedOrder.createdAt)} • {formatOrderTime(selectedOrder.createdAt)}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                          {item.qty}x
                        </span>
                        <p className="font-medium">{item.name}</p>
                      </div>
                      <p className="font-bold">{formatINR(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <p className="text-lg font-bold">Total Amount</p>
                <p className="text-2xl font-black text-primary">{formatINR(selectedOrder.total)}</p>
              </div>

              {canCancel(selectedOrder.status) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCancelOrderId(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  className="w-full rounded-xl border border-destructive/40 bg-destructive/5 py-3 text-sm font-bold text-destructive transition-all hover:bg-destructive/10"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
