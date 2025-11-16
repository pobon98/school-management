"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase-client";
import { useAuthRedirect } from "../../../lib/useAuthRedirect";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  class: string | null;
  due_date: string | null;
};

export default function DashboardAssignmentsPage() {
  const { user, loading: authLoading } = useAuthRedirect();
  const [role, setRole] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentClass, setStudentClass] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [klass, setKlass] = useState("");
  const [due, setDue] = useState("");
  const [desc, setDesc] = useState("");
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
    const loadAssignments = async () => {
      if (!user || !role) return;
      setLoading(true);
      setError(null);

      // Students: only see assignments for their class
      if (role === "student") {
        const { data: studentRow, error: studentError } = await supabase
          .from("students")
          .select("class")
          .eq("email", user.email)
          .maybeSingle();

        if (studentError) {
          setError(studentError.message);
          setAssignments([]);
          setLoading(false);
          return;
        }

        const foundClass = (studentRow as any)?.class as string | null;
        if (!foundClass) {
          setAssignments([]);
          setLoading(false);
          return;
        }

        setStudentClass(foundClass);

        const { data, error } = await supabase
          .from("assignments")
          .select("id, title, description, class, due_date")
          .eq("class", foundClass)
          .order("due_date", { ascending: true });

        if (error) {
          setError(error.message);
          setAssignments([]);
        } else if (data) {
          setAssignments(data as Assignment[]);
        }
        setLoading(false);
        return;
      }

      // Admin/teacher: see all assignments
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, description, class, due_date")
        .order("due_date", { ascending: true });
      if (error) {
        setError(error.message);
        setAssignments([]);
      } else if (data) {
        setAssignments(data as Assignment[]);
      }
      setLoading(false);
    };

    loadAssignments();
  }, [user, role]);

  const canCreate = role === "admin" || role === "teacher";

  const visibleAssignments =
    role === "student" && studentClass
      ? assignments.filter((a) => a.class === studentClass)
      : assignments;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Management</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Assignments</h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
              View assignments created for classes in your school.
            </p>
          </div>
        </header>
        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-900">Assignments</h2>
            {loading && <span className="text-[11px] text-slate-400">Loading...</span>}
          </div>
          {error && (
            <p className="mb-1 text-[11px] text-rose-600">Error: {error}</p>
          )}

          {canCreate && !authLoading && (
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3">
              <p className="text-[11px] font-semibold text-slate-800">Create assignment</p>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Class (e.g. 5A)"
                  value={klass}
                  onChange={(e) => setKlass(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  disabled={saving || !title.trim() || !klass.trim() || !user}
                  onClick={async () => {
                    if (!user || !title.trim() || !klass.trim()) return;
                    setSaving(true);
                    const { error: insertError } = await supabase.from("assignments").insert({
                      title: title.trim(),
                      description: desc.trim() || null,
                      class: klass.trim(),
                      due_date: due || null,
                      created_by: user.id,
                    });
                    if (insertError) {
                      setError(insertError.message);
                    } else {
                      setTitle("");
                      setDesc("");
                      setKlass("");
                      setDue("");
                      const { data, error: reloadError } = await supabase
                        .from("assignments")
                        .select("id, title, description, class, due_date")
                        .order("due_date", { ascending: true });
                      if (reloadError) {
                        setError(reloadError.message);
                      } else if (data) {
                        setAssignments(data as Assignment[]);
                      }
                    }
                    setSaving(false);
                  }}
                  className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {visibleAssignments.length === 0 && !loading ? (
              <p className="text-xs text-slate-500">No assignments yet.</p>
            ) : (
              <ul className="space-y-2 text-xs text-slate-700">
                {visibleAssignments.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-1">{a.title}</p>
                      {a.description && (
                        <p className="mt-0.5 text-slate-600 line-clamp-2">{a.description}</p>
                      )}
                      {a.class && (
                        <p className="mt-0.5 text-[10px] text-slate-500">Class: {a.class}</p>
                      )}
                    </div>
                    {a.due_date && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Due {a.due_date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
