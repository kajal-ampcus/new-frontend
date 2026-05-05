import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Sun, Sunrise, Moon, Plus, Minus, Search, Leaf, Drumstick, Coffee, Star, Clock, Check, ShoppingCart } from "lucide-react";
import { useStore, formatINR, addToCart, getMealSlots, type MenuItem, type ItemCategory } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type MenuSearch = {
  slot?: string;
};

export const Route = createFileRoute("/menu")({ 
  component: Menu,
  validateSearch: (search: Record<string, unknown>): MenuSearch => {
    return {
      slot: search.slot as string | undefined,
    };
  },
});

function Menu() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const menu = useStore((s) => s.menu);
  const cart = useStore((s) => s.cart);
  const mealSlots = getMealSlots();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "All">("All");
  const activeSlot = mealSlots.find((s) => s.status === "active");
  const defaultSlot = activeSlot?.name || mealSlots.find((s) => s.status === "upcoming")?.name || "All";
  const [selectedSlot, setSelectedSlot] = useState<string>(search.slot || defaultSlot);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get active slot (already defined above but let's keep the variable for below)
  const filteredMenu = menu.filter((item) => {
    if (!item.live) return false;
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (selectedSlot !== "All" && item.slot !== selectedSlot) return false;
    
    // If showing All, don't show expired slot items
    if (selectedSlot === "All") {
      const slotInfo = mealSlots.find(s => s.name === item.slot);
      if (slotInfo && slotInfo.status === "expired") return false;
    }

    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by slot
  const menuBySlot = filteredMenu.reduce((acc, item) => {
    if (!acc[item.slot]) acc[item.slot] = [];
    acc[item.slot].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories: { value: ItemCategory | "All"; label: string; icon: typeof Leaf }[] = [
    { value: "All", label: "All Items", icon: Star },
    { value: "Veg", label: "Vegetarian", icon: Leaf },
    { value: "Non-Veg", label: "Non-Veg", icon: Drumstick },
    { value: "Beverages", label: "Beverages", icon: Coffee },
  ];

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      itemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });

    // Show added animation
    setAddedItems((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);

    toast.success(`Added ${item.name} to cart!`, {
      description: formatINR(item.price),
      duration: 2000,
    });
  };

  const getCartItemQty = (itemId: string) => {
    const cartItem = cart.find((c) => c.itemId === itemId);
    return cartItem?.qty ?? 0;
  };

  const getSlotIcon = (slot: string) => {
    if (slot.toLowerCase().includes("breakfast")) return Sunrise;
    if (slot.toLowerCase().includes("lunch")) return Sun;
    return Moon;
  };

  const getCategoryColor = (category: ItemCategory) => {
    switch (category) {
      case "Veg":
        return "bg-emerald-500";
      case "Non-Veg":
        return "bg-red-500";
      case "Beverages":
        return "bg-blue-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <AppLayout title="Menu">
      <div className={`space-y-6 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Today's Menu</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeSlot ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {activeSlot.name} is open now
                  </span>
                  {" • "}Closes at {activeSlot.endTime}
                </>
              ) : (
                "Check available slots for ordering"
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            {/* View Cart Button */}
            {cart.length > 0 && (
              <button
                onClick={() => navigate({ to: "/cart" })}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>View Cart</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary text-[10px] font-black">
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Slot Pills */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {mealSlots.map((slot) => {
            const SlotIcon = getSlotIcon(slot.name);
            const isActive = slot.status === "active";
            const isExpired = slot.status === "expired";

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(selectedSlot === slot.name ? "All" : slot.name)}
                disabled={isExpired}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedSlot === slot.name
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : isActive
                    ? "border-2 border-primary bg-primary/10 text-primary"
                    : isExpired
                    ? "border border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                    : "border border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                <SlotIcon className="h-4 w-4" />
                <span>{slot.name}</span>
                {isActive && selectedSlot !== slot.name && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? "bg-primary text-white shadow-md"
                  : "border border-border bg-card hover:bg-muted"
              }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Ordering Rule Notice */}
        {activeSlot && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <Clock className="h-5 w-5 text-primary" />
            <p className="text-sm">
              <span className="font-semibold text-primary">Ordering Tip:</span>{" "}
              Orders must be placed 30 minutes before the slot ends for same-slot pickup.
            </p>
          </div>
        )}

        {/* Menu Grid */}
        {Object.keys(menuBySlot).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">No items found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          Object.entries(menuBySlot).map(([slot, items]) => (
            <div key={slot} className="space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const SlotIcon = getSlotIcon(slot);
                  return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <SlotIcon className="h-4 w-4" />
                    </div>
                  );
                })()}
                <h2 className="text-lg font-bold">{slot}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {items.length} items
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => {
                  const qty = getCartItemQty(item.id);
                  const isAdded = addedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 card-hover"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Image */}
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Tags */}
                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          {item.tag && (
                            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                              {item.tag}
                            </span>
                          )}
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full ${getCategoryColor(item.category)}`}
                          >
                            {item.category === "Veg" ? (
                              <Leaf className="h-3 w-3 text-white" />
                            ) : item.category === "Non-Veg" ? (
                              <Drumstick className="h-3 w-3 text-white" />
                            ) : (
                              <Coffee className="h-3 w-3 text-white" />
                            )}
                          </span>
                        </div>

                        {/* Price overlay */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{item.name}</h3>
                          </div>
                          <span className="rounded-lg bg-white/20 px-3 py-1 text-lg font-bold text-white backdrop-blur-sm">
                            {formatINR(item.price)}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>

                        {/* Add to cart */}
                        <div className="mt-4">
                          {qty > 0 ? (
                            <div className="flex items-center justify-between rounded-xl bg-primary/10 p-1">
                              <button
                                onClick={() => {
                                  const newQty = qty - 1;
                                  if (newQty <= 0) {
                                    // Remove from cart
                                    import("@/lib/store").then(({ removeFromCart }) => {
                                      removeFromCart(item.id);
                                    });
                                  } else {
                                    import("@/lib/store").then(({ updateCartItemQty }) => {
                                      updateCartItemQty(item.id, newQty);
                                    });
                                  }
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-lg font-bold text-primary">{qty}</span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-colors hover:bg-primary/90"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                                isAdded
                                  ? "bg-success text-white"
                                  : "bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 btn-press"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Added!
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

    </AppLayout>
  );
}
