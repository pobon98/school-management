export default function EventsPage() {
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
          <ul className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div>
                <p className="font-semibold text-slate-900">Annual Sports Day</p>
                <p className="mt-1 text-slate-600">Inter-house competitions, track and field events, and prize distribution.</p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">Dec</span>
            </li>
            <li className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div>
                <p className="font-semibold text-slate-900">Cultural Fest</p>
                <p className="mt-1 text-slate-600">Music, dance, drama, and exhibitions by students across all grades.</p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">Jan</span>
            </li>
            <li className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div>
                <p className="font-semibold text-slate-900">Parent-Teacher Meeting</p>
                <p className="mt-1 text-slate-600">Discuss academic progress, attendance, and plans for the next term.</p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">Feb</span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
