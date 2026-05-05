import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useStore, formatINR, updateCartItemQty, removeFromCart, clearCart, createOrder, deductFromWallet } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { ArrowLeft, X, Plus, Minus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const cart = useStore((s) => s.cart);
  const menu = useStore((s) => s.menu);
  const walletBalance = useStore((s) => s.walletBalance);
  const user = getCurrentUser();

  // Group cart items by slot
  const cartWithSlots = cart.map(item => {
    const menuItem = menu.find(m => m.id === item.itemId);
    return { ...item, slot: menuItem?.slot || "Unknown" };
  });

  const slots = Array.from(new Set(cartWithSlots.map(item => item.slot)));

  const handleClearSlot = (slot: string) => {
    cartWithSlots.filter(item => item.slot === slot).forEach(item => {
      removeFromCart(item.itemId);
    });
  };

  const handleCheckoutSlot = (slot: string, slotTotal: number) => {
    const itemsForSlot = cartWithSlots.filter(item => item.slot === slot);
    if (!itemsForSlot.length) return;

    if (walletBalance < slotTotal) {
      toast.error("Insufficient wallet balance");
      return;
    }

    const success = deductFromWallet(slotTotal);
    if (success) {
      createOrder({
        customerId: user?.id || "guest",
        customerName: user?.name || "Guest",
        department: user?.department || "Unknown",
        slot: slot,
        items: itemsForSlot.map(i => ({ itemId: i.itemId, name: i.name, qty: i.qty, price: i.price })),
        total: slotTotal,
        status: "Pending",
      });

      // Remove checked out items from cart
      itemsForSlot.forEach(item => removeFromCart(item.itemId));

      toast.success(`Order placed for ${slot}`);
      if (cart.length === itemsForSlot.length) {
        navigate({ to: "/orders" });
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <AppLayout title="Cart">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          onClick={() => navigate({ to: "/menu" })}
          className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue ordering
        </button>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center bg-card">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground opacity-50" />
            <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add some delicious meals from our menu.</p>
            <button
              onClick={() => navigate({ to: "/menu" })}
              className="mt-6 rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_350px]">
            {/* Left Column: Cart Items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-2xl border bg-card p-6">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  Cart <span className="text-sm font-normal text-muted-foreground">({cart.length} products)</span>
                </h1>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear cart
                </button>
              </div>

              <div className="space-y-6">
                {slots.map(slot => {
                  const slotItems = cartWithSlots.filter(item => item.slot === slot);
                  const slotTotal = slotItems.reduce((sum, item) => sum + item.price * item.qty, 0);

                  return (
                    <div key={slot} className="rounded-2xl border bg-card overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UtensilsCrossed className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="font-bold">{slot}</h2>
                            <p className="text-xs text-muted-foreground">Separate checkout and order ID</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleClearSlot(slot)}
                          className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors"
                        >
                          Clear slot
                        </button>
                      </div>

                      <div className="px-6 pb-6">
                        <div className="rounded-2xl bg-muted/30 border p-1">
                          {/* Table Header */}
                          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <div>Product</div>
                            <div className="w-24 text-center">Count</div>
                            <div className="w-24 text-right">Price</div>
                          </div>

                          <div className="divide-y border-t">
                            {slotItems.map(item => (
                              <div key={item.itemId} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="h-16 w-16 overflow-hidden rounded-xl border bg-card shrink-0">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-muted-foreground">No img</div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-sm">{item.name}</h3>
                                    <p className="text-xs text-muted-foreground">{slot}</p>
                                  </div>
                                </div>
                                
                                <div className="flex w-24 items-center justify-center gap-2 rounded-full border bg-card px-2 py-1 shadow-sm">
                                  <button
                                    onClick={() => updateCartItemQty(item.itemId, item.qty - 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                                  <button
                                    onClick={() => updateCartItemQty(item.itemId, item.qty + 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>

                                <div className="flex w-24 items-center justify-end gap-3">
                                  <span className="font-bold">{formatINR(item.price * item.qty)}</span>
                                  <button
                                    onClick={() => removeFromCart(item.itemId)}
                                    className="text-destructive hover:text-destructive/80 transition-colors p-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-4 text-right border-t bg-muted/10">
                        <span className="text-sm text-muted-foreground mr-3">Slot total</span>
                        <span className="text-lg font-bold text-primary">{formatINR(slotTotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Summary Panel */}
            <div className="rounded-2xl border bg-card p-6 h-fit sticky top-24">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatINR(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet balance</span>
                  <span className="font-medium">{formatINR(walletBalance)}</span>
                </div>
                <div className="my-4 border-t" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg">{formatINR(subtotal)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {slots.map(slot => {
                  const slotItems = cartWithSlots.filter(item => item.slot === slot);
                  const slotTotal = slotItems.reduce((sum, item) => sum + item.price * item.qty, 0);
                  const canAfford = walletBalance >= slotTotal;

                  return (
                    <button
                      key={`checkout-${slot}`}
                      onClick={() => handleCheckoutSlot(slot, slotTotal)}
                      disabled={!canAfford}
                      className={`w-full rounded-xl py-3.5 font-bold text-white transition-all ${
                        canAfford 
                          ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]" 
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      Checkout {slot} - {formatINR(slotTotal)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
