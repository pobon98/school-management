"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase-client";
import { useAuthRedirect } from "../../../lib/useAuthRedirect";

type Teacher = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  subject: string | null;
  email: string | null;
};

export default function DashboardTeachersPage() {
  const { user, loading: authLoading } = useAuthRedirect();
  const [role, setRole] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const rawRole = (data as any)?.role as string | null;
      setRole(rawRole ? rawRole.toLowerCase() : null);
    };

    loadRole();
  }, [user]);

  useEffect(() => {
    const loadTeachers = async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, subject, email")
        .order("first_name", { ascending: true });
      if (error) {
        setError(error.message);
      } else if (data) {
        setTeachers(data as Teacher[]);
      }
      setLoading(false);
    };

    loadTeachers();
  }, []);

  const isAdmin = role === "admin";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Management</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Teachers</h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
              Use this section to view and manage teacher data in the future.
            </p>
          </div>
        </header>

        {isAdmin && !authLoading && (
          <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-3">
            <p className="text-[11px] font-semibold text-slate-800">Add teacher</p>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                disabled={saving || !name.trim()}
                onClick={async () => {
                  if (!name.trim()) return;
                  setSaving(true);
                  const trimmedName = name.trim();
                  const [firstName, ...rest] = trimmedName.split(" ");
                  const lastName = rest.join(" ") || null;
                  const { error } = await supabase.from("teachers").insert({
                    first_name: firstName,
                    last_name: lastName,
                    subject: subject.trim() || null,
                    email: email.trim() || null,
                  });

                  if (error) {
                    setError(error.message);
                  } else {
                    setName("");
                    setSubject("");
                    setEmail("");

                    const { data, error: reloadError } = await supabase
                      .from("teachers")
                      .select("id, first_name, last_name, subject, email")
                      .order("first_name", { ascending: true });
                    if (reloadError) {
                      setError(reloadError.message);
                    } else if (data) {
                      setTeachers(data as Teacher[]);
                    }
                  }

                  setSaving(false);
                }}
                className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Teacher list</h2>
            {loading && <span className="text-[11px] text-slate-400">Loading...</span>}
          </div>
          {error && (
            <p className="mb-2 text-[11px] text-rose-600">Error: {error}</p>
          )}
          {teachers.length === 0 && !loading ? (
            <p className="text-xs text-slate-500">No teachers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-separate border-spacing-y-1 text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-1 pr-4">Name</th>
                    <th className="py-1 pr-4">Subject</th>
                    <th className="py-1 pr-4">Email</th>
                    {isAdmin && <th className="py-1 pr-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="bg-slate-50/60">
                      <td className="py-1.5 pr-4 text-slate-900">
                        {`${t.first_name ?? ""}${t.last_name ? ` ${t.last_name}` : ""}`.trim() || "-"}
                      </td>
                      <td className="py-1.5 pr-4 text-slate-700">{t.subject || "-"}</td>
                      <td className="py-1.5 pr-4 text-slate-700">{t.email || "-"}</td>
                      {isAdmin && (
                        <td className="py-1.5 pr-2 text-right">
                          <button
                            onClick={async () => {
                              const { error: deleteError } = await supabase
                                .from("teachers")
                                .delete()
                                .eq("id", t.id);
                              if (deleteError) {
                                setError(deleteError.message);
                              } else {
                                setTeachers((prev) => prev.filter((te) => te.id !== t.id));
                              }
                            }}
                            className="text-[10px] text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
