export default function CoursesPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Explore</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Courses</h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-xl">
              Browse the main programs and subjects offered by the school.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">Grade 1 - 5</p>
            <p className="mt-1 text-xs text-slate-600">
              Foundation courses in language, maths, science, and creativity.
            </p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Middle</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">Grade 6 - 8</p>
            <p className="mt-1 text-xs text-slate-600">
              Strong focus on core subjects and introduction to labs and projects.
            </p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secondary</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">Grade 9 - 12</p>
            <p className="mt-1 text-xs text-slate-600">
              Exam-focused curriculum with streams like science, commerce, and arts.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Why our courses?</h2>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Balanced focus on academics, activities, and character building.</li>
            <li>• Regular assessments and feedback for students and parents.</li>
            <li>• Modern labs, library access, and digital learning tools.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
