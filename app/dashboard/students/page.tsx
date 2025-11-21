"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase-client";
import { useAuthRedirect } from "../../../lib/useAuthRedirect";

type Student = {
  id: string;
  name: string;
  class: string | null;
  roll_no: string | null;
  email: string | null;
};

export default function DashboardStudentsPage() {
  const { user, loading: authLoading } = useAuthRedirect();
  const [role, setRole] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [studentAssignmentCount, setStudentAssignmentCount] = useState<number | null>(null);

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
    const loadStudents = async () => {
      if (!user || !role) return;

      // If the logged-in user is a student, only show classmates from their class
      if (role === "student") {
        if (!user.email) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const { data: studentRow, error: studentLookupError } = await supabase
          .from("students")
          .select("class")
          .eq("email", user.email)
          .maybeSingle();

        if (studentLookupError) {
          setError(studentLookupError.message);
          setStudents([]);
          setLoading(false);
          return;
        }

        const studentClassValue = (studentRow as any)?.class as string | null;
        if (!studentClassValue) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("students")
          .select("id, name, class, roll_no, email")
          .eq("class", studentClassValue)
          .order("roll_no", { ascending: true });

        if (error) {
          setError(error.message);
        } else if (data) {
          setStudents(data as Student[]);
        }
        setLoading(false);
        return;
      }

      // Admins (and future teachers) can see all students
      const { data, error } = await supabase
        .from("students")
        .select("id, name, class, roll_no, email")
        .order("class", { ascending: true });
      if (error) {
        setError(error.message);
      } else if (data) {
        setStudents(data as Student[]);
      }
      setLoading(false);
    };

    loadStudents();
  }, [user, role]);

  useEffect(() => {
    const loadAssignmentsForStudent = async () => {
      if (role !== "student" || !user?.email) return;

      const { data: studentRow } = await supabase
        .from("students")
        .select("class")
        .eq("email", user.email)
        .maybeSingle();

      const studentClass = (studentRow as any)?.class as string | null;
      if (!studentClass) return;

      const { data } = await supabase
        .from("assignments")
        .select("id")
        .eq("class", studentClass);

      setStudentAssignmentCount(data ? data.length : 0);
    };

    loadAssignmentsForStudent();
  }, [role, user]);

  const isAdmin = role === "admin";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Management</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Students</h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
              View and manage student information from this section of the dashboard.
            </p>
          </div>
        </header>

        {isAdmin && !authLoading && (
          <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-3">
            <p className="text-[11px] font-semibold text-slate-800">Add student</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Class (e.g. 5A)"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Roll number"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
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
                  const { error } = await supabase.from("students").insert({
                    name: trimmedName,
                    first_name: trimmedName,
                    last_name: trimmedName,
                    class: studentClass.trim() || null,
                    roll_no: rollNo.trim() || null,
                    email: email.trim() || null,
                  });
                  if (error) {
                    setError(error.message);
                  } else {
                    setName("");
                    setStudentClass("");
                    setRollNo("");
                    setEmail("");

                    const { data, error: reloadError } = await supabase
                      .from("students")
                      .select("id, name, class, roll_no, email")
                      .order("class", { ascending: true });
                    if (reloadError) {
                      setError(reloadError.message);
                    } else if (data) {
                      setStudents(data as Student[]);
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
            <h2 className="text-sm font-semibold text-slate-900">Student list</h2>
            {loading && <span className="text-[11px] text-slate-400">Loading...</span>}
          </div>
          {error && (
            <p className="mb-2 text-[11px] text-rose-600">Error: {error}</p>
          )}
          {role === "student" && studentAssignmentCount !== null && (
            <div className="mb-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex items-center justify-between">
              <span>
                You have {studentAssignmentCount} assignment
                {studentAssignmentCount === 1 ? "" : "s"} for your class.
              </span>
              <a
                href="/dashboard/assignments"
                className="font-medium underline-offset-2 hover:underline"
              >
                View
              </a>
            </div>
          )}
          {students.length === 0 && !loading ? (
            <p className="text-xs text-slate-500">No students added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-separate border-spacing-y-1 text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-1 pr-4">Name</th>
                    <th className="py-1 pr-4">Class</th>
                    <th className="py-1 pr-4">Roll</th>
                    <th className="py-1 pr-4">Email</th>
                    {isAdmin && <th className="py-1 pr-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="bg-slate-50/60">
                      <td className="py-1.5 pr-4 text-slate-900">{s.name}</td>
                      <td className="py-1.5 pr-4 text-slate-700">{s.class || "-"}</td>
                      <td className="py-1.5 pr-4 text-slate-700">{s.roll_no || "-"}</td>
                      <td className="py-1.5 pr-4 text-slate-700">{s.email || "-"}</td>
                      {isAdmin && (
                        <td className="py-1.5 pr-2 text-right">
                          <button
                            onClick={async () => {
                              const { error: deleteError } = await supabase
                                .from("students")
                                .delete()
                                .eq("id", s.id);
                              if (deleteError) {
                                setError(deleteError.message);
                              } else {
                                setStudents((prev) => prev.filter((st) => st.id !== s.id));
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
