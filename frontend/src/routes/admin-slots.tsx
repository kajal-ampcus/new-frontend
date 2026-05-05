import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Clock, Plus, Pencil, X, Sparkles, Calendar, Check, Eye, Trash2 } from "lucide-react";
import { AdminLayout } from "./admin-orders";
import { useStore, formatINR, type ItemCategory, type ItemType } from "@/lib/store";

export const Route = createFileRoute("/admin-slots")({ component: AdminSlots });

const CATEGORIES_BY_TYPE: Record<ItemType, ItemCategory[]> = {
  Breakfast: ["Beverages", "Veg"],
  Meal: ["Veg", "Non-Veg", "Beverages"],
};

type SlotType = {
  label: string;
  name: string;
  time: string;
  date: string;
  start: string;
  end: string;
  type: ItemType;
  category: ItemCategory;
  active: boolean;
  selectedItems: string[];
  disabledItems: string[];
  occ: string;
  pct: number;
  status: string;
  statusColor: string;
  barColor: string;
  extra: string;
};

function AdminSlots() {
  const menu = useStore((s) => s.menu);
  const [showAdd, setShowAdd] = useState(false);
  const [viewItemsSlot, setViewItemsSlot] = useState<SlotType | undefined>(undefined);
  const [editingSlot, setEditingSlot] = useState<SlotType | undefined>(undefined);
  const [slots, setSlots] = useState<SlotType[]>([
    { label: "MORNING SESSION", name: "Breakfast", date: "2024-01-01", start: "07:00", end: "09:00", time: "07:00 — 09:00", type: "Breakfast", category: "Veg", active: false, selectedItems: [], disabledItems: [], occ: "40/40", pct: 100, status: "CLOSED", statusColor: "bg-destructive text-destructive-foreground", barColor: "bg-destructive", extra: "+18" },
    { label: "PEAK SESSION", name: "Lunch", date: "2024-01-01", start: "12:00", end: "14:00", time: "12:00 — 14:00", type: "Meal", category: "Non-Veg", active: true, selectedItems: [], disabledItems: [], occ: "124/150", pct: 83, status: "● ACTIVE", statusColor: "bg-primary text-primary-foreground", barColor: "bg-primary", extra: "+102" },
    { label: "LIGHT SESSION", name: "Evening Snacks", date: "2024-01-01", start: "16:30", end: "17:30", time: "16:30 — 17:30", type: "Meal", category: "Veg", active: true, selectedItems: [], disabledItems: [], occ: "12/50", pct: 24, status: "● ACTIVE", statusColor: "bg-primary text-primary-foreground", barColor: "bg-info", extra: "+9" },
    { label: "EVENING SESSION", name: "Dinner", date: "2024-01-01", start: "19:30", end: "21:00", time: "19:30 — 21:00", type: "Meal", category: "Non-Veg", active: true, selectedItems: [], disabledItems: [], occ: "5/100", pct: 5, status: "● ACTIVE", statusColor: "bg-primary text-primary-foreground", barColor: "bg-success", extra: "+4" },
  ]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const computedSlots = useMemo(() => {
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    return slots.map(s => {
      if (!s.active) {
        return { ...s, status: "CLOSED", statusColor: "bg-destructive text-destructive-foreground" };
      }

      const [startH, startM] = s.start.split(':').map(Number);
      const [endH, endM] = s.end.split(':').map(Number);
      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;

      if (currentTotalMinutes > endTotalMinutes) {
        return { ...s, status: "CLOSED", statusColor: "bg-destructive text-destructive-foreground" };
      }
      
      if (currentTotalMinutes >= startTotalMinutes) {
        return { ...s, status: "● ACTIVE", statusColor: "bg-primary text-primary-foreground" };
      }

      return { ...s, status: "UPCOMING", statusColor: "bg-muted text-muted-foreground" };
    });
  }, [slots, now]);

  const handleEditSlot = (slot: SlotType) => {
    setEditingSlot(slot);
    setShowAdd(true);
  };

  const handleViewSlotItems = (slot: SlotType) => {
    setViewItemsSlot(slot);
  };

  const handleToggleSlotItem = (slotName: string, itemName: string) => {
    setSlots((current) => {
      const next = current.map((item) => {
        if (item.name !== slotName) return item;
        const disabledItems = item.disabledItems ?? [];
        const updatedDisabled = disabledItems.includes(itemName)
          ? disabledItems.filter((name) => name !== itemName)
          : [...disabledItems, itemName];
        return { ...item, disabledItems: updatedDisabled };
      });
      if (viewItemsSlot?.name === slotName) {
        setViewItemsSlot(next.find((item) => item.name === slotName));
      }
      return next;
    });
  };

  const handleDeleteSlot = (slotName: string) => {
    if (confirm(`Are you sure you want to delete the ${slotName} slot?`)) {
      setSlots((current) => current.filter((item) => item.name !== slotName));
    }
  };

  const handleUpdateSlot = (updatedSlot: Partial<SlotType>) => {
    if (editingSlot) {
      setSlots((current) =>
        current.map((item) =>
          item.name === editingSlot.name
            ? {
                ...item,
                ...updatedSlot,
                time: updatedSlot.time ?? item.time,
                disabledItems: updatedSlot.disabledItems ?? item.disabledItems,
              }
            : item,
        ),
      );
      setShowAdd(false);
      setEditingSlot(undefined);
    }
  };

  return (
    <AdminLayout crumb="Time Slots">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Meal Slot Management</h1>
        <p className="text-xs text-muted-foreground">Configure operational windows and assign menu items per slot.</p>
      </div>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {computedSlots.map((s) => (
          <div key={s.name} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="text-[10px] tracking-widest text-muted-foreground">{s.label}</div>
              <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${s.statusColor}`}>{s.status}</span>
            </div>
            <div className="mt-1 text-xl font-bold">{s.name}</div>
            <div className="text-[11px] text-muted-foreground">{s.time}</div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Occupancy</span><span className="font-semibold text-foreground">{s.occ} <span className="text-muted-foreground">({s.pct}%)</span></span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className={`h-1.5 rounded-full ${s.barColor}`} style={{ width: `${s.pct}%` }} />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => handleViewSlotItems(s)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="View slot items"
              >
                <Eye className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleEditSlot(s)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Edit slot"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleDeleteSlot(s.name)}
                className="rounded p-1 text-muted-foreground hover:bg-red-500/20 hover:text-red-500"
                title="Delete slot"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <button onClick={() => setShowAdd(true)} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/40 p-6 text-center hover:border-primary hover:bg-card/60 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-primary hover:bg-primary hover:text-primary-foreground transition-colors"><Plus className="h-5 w-5" /></div>
        </button>
      </div>


      {showAdd && <SlotModal onClose={() => { setShowAdd(false); setEditingSlot(undefined); }} slot={editingSlot} onUpdate={handleUpdateSlot} />}
      {viewItemsSlot && (
        <SlotItemsModal
          slot={viewItemsSlot}
          menu={menu}
          onClose={() => setViewItemsSlot(undefined)}
          onToggleItem={handleToggleSlotItem}
        />
      )}
    </AdminLayout>
  );
}

function SlotModal({ onClose, slot, onUpdate }: { onClose: () => void; slot?: SlotType; onUpdate?: (updatedSlot: Partial<SlotType>) => void }) {
  const menu = useStore((s) => s.menu);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(slot?.date ?? "2024-01-01");
  const [start, setStart] = useState(slot?.start ?? "07:00");
  const [end, setEnd] = useState(slot?.end ?? "09:00");
  const [active, setActive] = useState(slot?.active ?? true);
  const [mealType, setMealType] = useState<ItemType>(slot?.type ?? "Meal");
  const [category, setCategory] = useState<ItemCategory>(slot?.category ?? "Veg");
  const [selectedItems, setSelectedItems] = useState<string[]>(slot?.selectedItems ?? []);
  const [disabledItems, setDisabledItems] = useState<string[]>(slot?.disabledItems ?? []);
  const [slotName, setSlotName] = useState(slot?.name ?? "");

  useEffect(() => {
    if (slot) {
      setDate(slot.date ?? "2024-01-01");
      setStart(slot.start ?? "07:00");
      setEnd(slot.end ?? "09:00");
      setActive(slot.active ?? true);
      setMealType(slot.type ?? "Meal");
      setCategory(slot.category ?? "Veg");
      setSelectedItems(slot.selectedItems ?? []);
      setDisabledItems(slot.disabledItems ?? []);
      setSlotName(slot.name);
    } else {
      setDate("2024-01-01");
      setStart("07:00");
      setEnd("09:00");
      setActive(true);
      setMealType("Meal");
      setCategory("Veg");
      setSelectedItems([]);
      setDisabledItems([]);
      setSlotName("");
    }
  }, [slot]);

  const validCategories = CATEGORIES_BY_TYPE[mealType];
  useEffect(() => {
    if (!validCategories.includes(category)) {
      setCategory(validCategories[0]);
    }
  }, [mealType, category, validCategories]);

  const filteredItems = useMemo(
    () => menu.filter((i) => i.type === mealType && i.category === category && i.live),
    [menu, mealType, category],
  );

  const handleSave = () => {
    const updatedData: Partial<SlotType> = {
      name: slotName,
      date,
      start,
      end,
      time: `${start} — ${end}`,
      active,
      type: mealType,
      category,
      selectedItems,
      disabledItems: disabledItems.filter((name) => selectedItems.includes(name)),
    };

    if (slot && onUpdate) {
      onUpdate(updatedData);
    } else {
      // Handle new slot creation
      console.log('Creating new slot:', updatedData);
      onClose();
    }
  };

  const toggleItem = (name: string) =>
    setSelectedItems((cur) => {
      const next = cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name];
      if (!next.includes(name)) {
        setDisabledItems((curDisabled) => curDisabled.filter((n) => n !== name));
      }
      return next;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6">
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground"><X className="h-4 w-4" /></button>
        <div className="mb-4">
          <div className="text-lg font-bold">{slot ? "Edit Slot" : "Add New Slot"}</div>
          <div className="text-xs text-muted-foreground">{slot ? "Modify the dining window and menu" : "Configure a dining window and assign its menu"}</div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Slot Name</Label>
            <input 
              placeholder="e.g., Early Breakfast" 
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm outline-none" 
            />
          </div>

          <div>
            <Label>Date</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <label className="relative block cursor-pointer" onClick={() => startInputRef.current?.showPicker?.()}>
                <input
                  ref={startInputRef}
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full rounded-md border border-border bg-input/40 px-3 py-2 pr-10 text-sm outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </span>
              </label>
            </div>
            <div>
              <Label>End Time</Label>
              <label className="relative block cursor-pointer" onClick={() => endInputRef.current?.showPicker?.()}>
                <input
                  ref={endInputRef}
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full rounded-md border border-border bg-input/40 px-3 py-2 pr-10 text-sm outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </span>
              </label>
            </div>
          </div>

          <div>
            <Label>Meal Type</Label>
            <div className="flex gap-3">
              {(["Breakfast", "Meal"] as const).map((t) => (
                <label key={t} className={`flex flex-1 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${mealType === t ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}>
                  <input
                    type="radio"
                    name="mealType"
                    value={t}
                    checked={mealType === t}
                    onChange={() => { setMealType(t); setSelectedItems([]); }}
                    className="accent-primary"
                  />
                  <span className="font-semibold">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value as ItemCategory); setSelectedItems([]); }}
              className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm outline-none"
            >
              {validCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="mt-1 text-[10px] text-muted-foreground">Categories adjust based on meal type.</div>
          </div>

          <div>
            <Label>Assign Menu Items <span className="ml-1 text-muted-foreground">({filteredItems.length} matching)</span></Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-input/20 p-2">
              {filteredItems.length === 0 && (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">No items match this Meal Type & Category.</div>
              )}
              {filteredItems.map((it) => {
                const checked = selectedItems.includes(it.name);
                return (
                  <button
                    key={it.name}
                    type="button"
                    onClick={() => toggleItem(it.name)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${checked ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/40"}`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{it.name}</div>
                      <div className="text-[10px] text-muted-foreground">{it.category} · {it.type} · {formatINR(it.price)}</div>
                    </div>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                      {checked && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedItems.length > 0 && (
              <div className="mt-2 text-[11px] text-primary">{selectedItems.length} item(s) selected</div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-xs text-muted-foreground">Cancel</button>
          <button onClick={handleSave} className="rounded-md bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">{slot ? "Update Slot" : "Create Slot"}</button>
        </div>
      </div>
    </div>
  );
}

function SlotItemsModal({
  slot,
  menu,
  onClose,
  onToggleItem,
}: {
  slot: SlotType;
  menu: Array<{ name: string; category: ItemCategory; type: ItemType; price: number; live: boolean }>;
  onClose: () => void;
  onToggleItem: (slotName: string, itemName: string) => void;
}) {
  const itemEntries = slot.selectedItems.map((name) => {
    const item = menu.find((it) => it.name === name);
    return {
      name,
      category: item?.category ?? "Unknown",
      type: item?.type ?? "Meal",
      price: item?.price ?? 0,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6">
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground"><X className="h-4 w-4" /></button>
        <div className="mb-4">
          <div className="text-lg font-bold">Slot Item Availability</div>
          <div className="text-xs text-muted-foreground">View items for this slot and enable or disable them individually.</div>
        </div>

        {itemEntries.length === 0 ? (
          <div className="rounded-2xl bg-slate-100/90 p-5 text-center text-sm text-muted-foreground dark:bg-slate-900/90">
            No items have been assigned to this slot yet.
          </div>
        ) : (
          <div className="space-y-3">
            {itemEntries.map((item) => {
              const isDisabled = slot.disabledItems.includes(item.name);
              return (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground">{item.category} · {item.type} · {formatINR(item.price)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleItem(slot.name, item.name)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isDisabled ? "bg-rose-500" : "bg-emerald-500"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${isDisabled ? "translate-x-0.5" : "translate-x-5"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground">{children}</div>;
}
