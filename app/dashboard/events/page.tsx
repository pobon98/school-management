"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase-client";
import { useAuthRedirect } from "../../../lib/useAuthRedirect";

interface EventRow {
  id: string;
  title: string;
  description: string;
  month_short: string;
  date: string | null;
  created_at: string;
}

type Role = "admin" | "teacher" | "student";

export default function DashboardEventsPage() {
  const { user, loading: authLoading } = useAuthRedirect();
  const [role, setRole] = useState<Role | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMonth, setNewMonth] = useState("");
  const [newDate, setNewDate] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editDate, setEditDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load role from profiles
  useEffect(() => {
    if (!user) return;

    const loadRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const normalizedRole = (data?.role as string | null)?.toLowerCase() as
        | Role
        | undefined;

      setRole(normalizedRole ?? "student");
      setLoadingRole(false);
    };

    loadRole();
  }, [user]);

  // Load events
  const refreshEvents = async () => {
    setLoadingEvents(true);
    setEventsError(null);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, month_short, date, created_at")
      .order("date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      setEventsError("Unable to load events right now.");
    } else if (data) {
      setEvents(data as EventRow[]);
    }

    setLoadingEvents(false);
  };

  useEffect(() => {
    if (!user) return;
    refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isLoading = authLoading || loadingRole;
  const isAdmin = role === "admin";

  const resetNewForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewMonth("");
    setNewDate("");
  };

  const startEdit = (ev: EventRow) => {
    setEditingId(ev.id);
    setEditTitle(ev.title);
    setEditDescription(ev.description);
    setEditMonth(ev.month_short);
    setEditDate(ev.date ? ev.date.slice(0, 10) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditMonth("");
    setEditDate("");
    setSavingEdit(false);
  };

  const handleCreate = async () => {
    if (!user || !isAdmin) return;
    if (!newTitle.trim() || !newDescription.trim() || !newMonth.trim()) return;

    setCreating(true);
    const { error } = await supabase.from("events").insert({
      title: newTitle.trim(),
      description: newDescription.trim(),
      month_short: newMonth.trim(),
      date: newDate ? newDate : null,
    });

    if (!error) {
      resetNewForm();
      await refreshEvents();
    }

    setCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!user || !isAdmin || !editingId) return;
    if (!editTitle.trim() || !editDescription.trim() || !editMonth.trim()) return;

    setSavingEdit(true);
    const { error } = await supabase
      .from("events")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim(),
        month_short: editMonth.trim(),
        date: editDate ? editDate : null,
      })
      .eq("id", editingId);

    if (!error) {
      await refreshEvents();
      cancelEdit();
    } else {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !isAdmin) return;
    setDeletingId(id);
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) {
      await refreshEvents();
    }
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
        <div className="max-w-5xl mx-auto text-sm text-slate-500">Loading events...</div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md">
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Events</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Events overview</h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
              You can view upcoming school events on the public Events page. Only administrators can manage event listings.
            </p>
          </header>

          <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5">
            <p className="text-xs text-slate-600">
              You are signed in as a <span className="font-semibold">{role}</span>. If you think you should have access to manage
              events, please contact the school administrator.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Management</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
            Create, update, and remove upcoming events shown on the public Events page.
          </p>
        </header>

        {/* Create new event */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Add new event</h2>
              <p className="mt-1 text-xs text-slate-600">Fill in the details and publish it to the public events page.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-xs">
            <div className="space-y-1">
              <label className="block font-medium text-slate-800" htmlFor="event-title">
                Title
              </label>
              <input
                id="event-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
                placeholder="e.g. Annual Sports Day"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-slate-800" htmlFor="event-month">
                Month label
              </label>
              <input
                id="event-month"
                value={newMonth}
                onChange={(e) => setNewMonth(e.target.value)}
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
                placeholder="e.g. Dec"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block font-medium text-slate-800" htmlFor="event-description">
                Description
              </label>
              <textarea
                id="event-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
                placeholder="Short description of the event."
              />
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-slate-800" htmlFor="event-date">
                Date (optional)
              </label>
              <input
                id="event-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newTitle.trim() || !newDescription.trim() || !newMonth.trim()}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? "Publishing..." : "Publish event"}
            </button>
          </div>
        </section>

        {/* Existing events */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Existing events</h2>
            {loadingEvents && (
              <span className="text-[11px] text-slate-500">Refreshing...</span>
            )}
          </div>

          {eventsError && <p className="text-xs text-rose-600">{eventsError}</p>}

          {!eventsError && events.length === 0 && !loadingEvents && (
            <p className="text-xs text-slate-500">No events have been created yet.</p>
          )}

          {!eventsError && events.length > 0 && (
            <ul className="space-y-3 text-xs">
              {events.map((ev) => {
                const isEditing = editingId === ev.id;
                return (
                  <li
                    key={ev.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="flex-1 space-y-1">
                      {isEditing ? (
                        <>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            className="block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
                          />
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-medium text-slate-700">Month label</label>
                              <input
                                value={editMonth}
                                onChange={(e) => setEditMonth(e.target.value)}
                                className="block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] font-medium text-slate-700">Date (optional)</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/70"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                          <p className="text-xs text-slate-600">{ev.description}</p>
                          <div className="flex flex-wrap gap-2 items-center text-[11px] text-slate-500">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700">
                              {ev.month_short}
                            </span>
                            {ev.date && (
                              <span>
                                {new Date(ev.date).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 md:flex-col md:items-end md:justify-between">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => startEdit(ev)}
                          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={savingEdit}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {savingEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        disabled={deletingId === ev.id}
                        className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingId === ev.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
