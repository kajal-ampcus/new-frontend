import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { AdminLayout } from "./admin-orders";
import { useStore, createAnnouncement, updateAnnouncement, deleteAnnouncement, type Announcement } from "@/lib/store";

export const Route = createFileRoute("/admin-announcements")({ component: AdminAnnouncements });

type AnnouncementForm = {
  title: string;
  message: string;
  date: string;
  slot: string;
  specialDish: string;
  active: boolean;
};

const SLOT_OPTIONS = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;

function AdminAnnouncements() {
  const announcements = useStore((s) => s.announcements);
  const menu = useStore((s) => s.menu);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementForm>({
    title: "",
    message: "",
    date: new Date().toISOString().slice(0, 10),
    slot: "Lunch",
    specialDish: "",
    active: true,
  });

  const availableDishes = useMemo(
    () => menu.filter((item) => item.live).map((item) => item.name),
    [menu],
  );

  const handleEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      message: announcement.message,
      date: announcement.date,
      slot: announcement.slot,
      specialDish: announcement.specialDish,
      active: announcement.active,
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      title: "",
      message: "",
      date: new Date().toISOString().slice(0, 10),
      slot: "Lunch",
      specialDish: "",
      active: true,
    });
  };

  const handleSave = () => {
    const payload = {
      title: form.title,
      message: form.message,
      date: form.date,
      slot: form.slot,
      specialDish: form.specialDish,
      active: form.active,
    };

    if (!form.title.trim() || !form.message.trim()) return;

    if (editing) {
      updateAnnouncement(editing.id, payload);
    } else {
      createAnnouncement(payload);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this announcement?")) {
      deleteAnnouncement(id);
      if (editing?.id === id) resetForm();
    }
  };

  return (
    <AdminLayout crumb="Announcement">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-xs text-muted-foreground">Create announcements for special meals and celebrations on a given day or slot.</p>
        </div>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3 text-sm font-semibold text-foreground">
            <Bell className="h-4 w-4 text-primary" />
            Announcement Details
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Iftar Celebration"
                className="w-full rounded-2xl border border-border bg-input/60 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                rows={4}
                placeholder="Refreshment will be served in the lunch slot with a special dish."
                className="w-full rounded-2xl border border-border bg-input/60 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-input/60 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Slot</label>
                <select
                  value={form.slot}
                  onChange={(e) => setForm((s) => ({ ...s, slot: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-input/60 px-4 py-3 text-sm outline-none"
                >
                  {SLOT_OPTIONS.map((slot) => (
                    <option value={slot} key={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Special Dish</label>
                <select
                  value={form.specialDish}
                  onChange={(e) => setForm((s) => ({ ...s, specialDish: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-input/60 px-4 py-3 text-sm outline-none"
                >
                  <option value="">None</option>
                  {availableDishes.map((dish) => (
                    <option key={dish} value={dish}>{dish}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-border bg-background"
                />
                Active announcement
              </label>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" />
                {editing ? "Update Announcement" : "Create Announcement"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3 text-sm font-semibold text-foreground">
            <Bell className="h-4 w-4 text-primary" />
            Active announcements
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No announcements yet. Add one to show it on employee dashboards.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-3xl border border-border bg-slate-50 p-4 shadow-sm dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{announcement.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{announcement.date} • {announcement.slot}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Edit announcement"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded-full p-2 text-red-500 hover:bg-red-500/10"
                        title="Delete announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-foreground">{announcement.message}</div>
                  {announcement.specialDish && (
                    <div className="mt-3 rounded-2xl bg-primary/5 px-3 py-2 text-sm text-primary">Special dish: {announcement.specialDish}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
