export default function AdmissionPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Join us</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Admission</h1>
          <p className="mt-1 text-sm text-indigo-100/90 max-w-xl">
            Learn about the admission process, required documents, and key dates.
          </p>
        </header>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Admission steps</h2>
          <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1">
            <li>Submit an online application form with basic student details.</li>
            <li>Upload or provide copies of previous academic records.</li>
            <li>Attend an interaction/assessment scheduled by the school.</li>
            <li>Complete fee payment and verification to confirm admission.</li>
          </ol>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-5 py-5">
            <h3 className="text-sm font-semibold text-slate-900">Documents required</h3>
            <ul className="mt-2 text-xs text-slate-700 space-y-1">
              <li>• Birth certificate</li>
              <li>• Previous school transfer certificate (if applicable)</li>
              <li>• Recent report card / mark sheet</li>
              <li>• Passport size photographs</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-5 py-5">
            <h3 className="text-sm font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-xs text-slate-700">
              For more information about admissions, you can reach the school office
              during working hours or send us an email. We will guide you through the
              process.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
