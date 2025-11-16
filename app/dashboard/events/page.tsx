export default function DashboardEventsPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Management</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
            Track internal school events and activities within the dashboard.
          </p>
        </header>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5">
          <p className="text-xs text-slate-600">
            Later you can show upcoming events, past events, and quick actions here.
            For now, this is a simple placeholder card with matching styling.
          </p>
        </section>
      </div>
    </main>
  );
}
