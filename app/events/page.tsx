import { supabaseAdmin } from "../../lib/supabase-server";

interface Event {
  id: string;
  title: string;
  description: string;
  month_short: string;
  date: string | null;
  created_at: string;
}

export default async function EventsPage() {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id, title, description, month_short, date, created_at")
    .order("date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const events = (data as Event[] | null) ?? [];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Happening at school</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Events</h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-xl">
              Stay updated with upcoming activities, celebrations, and important days.
            </p>
          </div>
        </header>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming events</h2>

          {error && (
            <p className="text-xs text-rose-600">
              Unable to load events right now. Please check back later.
            </p>
          )}

          {!error && events.length === 0 && (
            <p className="text-xs text-slate-500">No upcoming events have been published yet.</p>
          )}

          {!error && events.length > 0 && (
            <ul className="space-y-3 text-xs text-slate-700">
              {events.map((event) => {
                const created = new Date(event.created_at);
                const now = new Date();
                const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                const isNew = diffDays <= 7;

                return (
                  <li
                    key={event.id}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        {isNew && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-slate-600">{event.description}</p>
                      {event.date && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {new Date(event.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">
                      {event.month_short}
                    </span>
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
