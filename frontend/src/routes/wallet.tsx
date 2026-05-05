import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Pagination } from "@/components/Pagination";
import {
  TrendingUp,
  Download,
  Wallet,
  Plus,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import { useStore, formatINR, getOrderStats, addToCustomerWallet, downloadCSV } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

// Static transaction data
const ALL_TRANSACTIONS = [
  { id: "1", date: "May 1, 10:00 AM", type: "Credit", description: "Monthly Allowance (Admin)", ref: "—", amount: "+₹2000", balance: "₹2000", isCredit: true },
  { id: "2", date: "May 1, 5:45 PM", type: "Debit", description: "Order Payment", ref: "ORD-9015", amount: "-₹400", balance: "₹1600", isCredit: false },
  { id: "3", date: "May 1, 5:40 PM", type: "Credit", description: "Refund (Cancelled Order)", ref: "ORD-9014", amount: "+₹700", balance: "₹1600", isCredit: true },
  { id: "4", date: "May 1, 5:36 PM", type: "Debit", description: "Order Payment", ref: "ORD-9014", amount: "-₹700", balance: "₹900", isCredit: false },
  { id: "5", date: "Apr 30, 1:10 PM", type: "Debit", description: "Order Payment", ref: "ORD-9013", amount: "-₹260", balance: "₹640", isCredit: false },
  { id: "6", date: "Apr 29, 9:05 AM", type: "Credit", description: "Wallet Top-up", ref: "—", amount: "+₹1000", balance: "₹1640", isCredit: true },
  { id: "7", date: "Apr 28, 7:50 PM", type: "Debit", description: "Order Payment", ref: "ORD-9012", amount: "-₹180", balance: "₹640", isCredit: false },
  { id: "8", date: "Apr 27, 12:30 PM", type: "Debit", description: "Order Payment", ref: "ORD-9011", amount: "-₹160", balance: "₹820", isCredit: false },
  { id: "9", date: "Apr 25, 10:15 AM", type: "Credit", description: "Monthly Allowance (Admin)", ref: "—", amount: "+₹2000", balance: "₹980", isCredit: true },
  { id: "10", date: "Apr 24, 1:00 PM", type: "Debit", description: "Order Payment", ref: "ORD-9010", amount: "-₹220", balance: "₹220", isCredit: false },
  { id: "11", date: "Apr 23, 5:20 PM", type: "Debit", description: "Order Payment", ref: "ORD-9009", amount: "-₹90", balance: "₹440", isCredit: false },
  { id: "12", date: "Apr 22, 9:00 AM", type: "Credit", description: "Wallet Top-up", ref: "—", amount: "+₹500", balance: "₹530", isCredit: true },
];

const PAGE_SIZE = 5;

function WalletPage() {
  const currentUser = getCurrentUser();
  const customers = useStore((s) => s.customers);
  const storeCustomer = customers.find((c) => c.empId === currentUser?.id);
  const customerId = storeCustomer?.id ?? "c1";

  const walletBalances = useStore((s) => s.walletBalances);
  const walletBalance = walletBalances[customerId] ?? 0;

  const orders = useStore((s) => s.orders);
  const [mounted, setMounted] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [selectedOrderRef, setSelectedOrderRef] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => { setMounted(true); }, []);

  const stats = getOrderStats();

  const selectedOrderDetails = selectedOrderRef
    ? orders.find((o) => o.orderNumber === selectedOrderRef) || {
      id: "dummy",
      orderNumber: selectedOrderRef,
      status: "Pending",
      createdAt: new Date().toISOString(),
      items: [
        { name: "Paneer Butter Masala", qty: 1, price: 180 }
      ],
      total: 180,
    }
    : null;

  const totalTxPages = Math.ceil(ALL_TRANSACTIONS.length / PAGE_SIZE);
  const pagedTransactions = ALL_TRANSACTIONS.slice(
    (txPage - 1) * PAGE_SIZE,
    txPage * PAGE_SIZE
  );

  const handleAddFunds = () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Please enter a valid amount"); return; }
    addToCustomerWallet(customerId, amount);
    toast.success(`Added ${formatINR(amount)} to your wallet!`);
    setAddAmount("");
    setShowAddFunds(false);
  };

  const handleExport = () => {
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    const exportTx = ALL_TRANSACTIONS.filter((t) => {
      const currentYear = new Date().getFullYear();
      const txDate = new Date(`${t.date} ${currentYear}`);
      return txDate >= start && txDate <= end;
    });

    const rows = [
      ["Date", "Type", "Description", "Ref", "Amount", "Balance"],
      ...exportTx.map((t) => [t.date, t.type, t.description, t.ref, t.amount, t.balance]),
    ];
    downloadCSV(`wallet-transactions-${dateRange.start}-to-${dateRange.end}.csv`, rows);
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <AppLayout title="Wallet">
      <div className={`space-y-6 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your balance and track spending</p>
          </div>
          {/* <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export Statement
          </button> */}
        </div>

        {/* Balance Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Main Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 p-6 text-white shadow-xl shadow-primary/25 md:col-span-2">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-medium text-white/80">Available Balance</span>
              </div>
              <p className="mt-2 text-4xl font-bold">{formatINR(walletBalance)}</p>
              {/* <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAddFunds(true)}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/30"
                >
                  <Plus className="h-4 w-4" />
                  Add Funds
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20">
                  <CreditCard className="h-4 w-4" />
                  Link Card
                </button>
              </div> */}
            </div>
          </div>

          {/* Stats Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-xs text-success">This Month</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{formatINR(stats.monthlySpending)}</p>
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold">Transaction History</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {ALL_TRANSACTIONS.length} transactions total
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-muted-foreground">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-widest text-muted-foreground">
                  <th className="px-5 py-4 font-medium">DATE</th>
                  <th className="px-5 py-4 font-medium">TYPE</th>
                  <th className="px-5 py-4 font-medium">DESCRIPTION</th>
                  <th className="px-5 py-4 font-medium">REF</th>
                  <th className="px-5 py-4 text-right font-medium">AMOUNT</th>
                  <th className="px-5 py-4 text-right font-medium">BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedTransactions.map((tx) => {
                  const isOrder = tx.ref !== "—";
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => { if (isOrder) setSelectedOrderRef(tx.ref); }}
                      className={`transition-colors ${isOrder ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/50"}`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{tx.date}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tx.isCredit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                            }`}
                        >
                          {tx.isCredit ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium">{tx.description}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs">
                        <span className={isOrder ? "font-medium text-primary" : "text-muted-foreground"}>
                          {tx.ref}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-5 py-4 text-right font-bold ${tx.isCredit ? "text-success" : "text-foreground"}`}>
                        {tx.amount}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-muted-foreground">{tx.balance}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={txPage}
            totalPages={totalTxPages}
            onPageChange={setTxPage}
            totalItems={ALL_TRANSACTIONS.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddFunds(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Add Funds</h2>
            <p className="mt-1 text-sm text-muted-foreground">Top up your wallet balance</p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(amt.toString())}
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddFunds(false)}
                className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
              >
                Add Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderRef && selectedOrderDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrderRef(null); }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl">
            {/* Header */}
            <div className="relative bg-[#EA580C] p-6 text-white">
              <button
                onClick={() => setSelectedOrderRef(null)}
                className="absolute right-4 top-4 rounded-full border-2 border-white/30 p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-xs font-bold uppercase tracking-wider text-white/90">
                Order Details
              </div>
              <h2 className="mt-1 text-3xl font-extrabold">{selectedOrderDetails.orderNumber}</h2>
              <div className="mt-4 flex items-center gap-3 text-sm font-medium">
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                  {selectedOrderDetails.status}
                </span>
                <span className="text-white/90">
                  {new Date(selectedOrderDetails.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}{" "}
                  •{" "}
                  {new Date(selectedOrderDetails.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order Items
              </div>
              <div className="mt-4 space-y-4">
                {selectedOrderDetails.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {item.qty}x
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{formatINR(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="my-6 border-t border-border" />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-bold text-[#EA580C]">
                  {formatINR(selectedOrderDetails.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
