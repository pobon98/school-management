"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase-client";
import { useAuthRedirect } from "../../../lib/useAuthRedirect";

type Role = "admin" | "teacher" | "student";

interface Profile {
  email: string | null;
  role: Role;
}

interface Term {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  class: string | null;
}

interface StudentRow {
  id: string;
  name: string;
  roll_no: string | null;
  email: string | null;
  class: string | null;
}

interface ResultRow {
  id: string;
  student_id: string;
  subject_id: string;
  term_id: string;
  marks_obtained: number;
  max_marks: number;
}

interface TermCgpaRow {
  id: string;
  student_id: string;
  term_id: string;
  cgpa: number;
}

interface EditableMark {
  resultId: string | null;
  marksObtained: string;
  maxMarks: string;
}

interface EditableCgpa {
  rowId: string | null;
  value: string;
}

export default function ResultsPage() {
  const { user, loading: authLoading } = useAuthRedirect();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const [marksByStudent, setMarksByStudent] = useState<Record<string, EditableMark>>({});
  const [cgpaByStudent, setCgpaByStudent] = useState<Record<string, EditableCgpa>>({});

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Load profile/role for current user
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("email, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        const normalizedRole = (data.role as string | null)?.toLowerCase() as Role | undefined;
        setProfile({
          email: (data.email as string | null) ?? null,
          role: normalizedRole ?? "student",
        });
      }

      setLoadingProfile(false);
    };

    loadProfile();
  }, [user]);

  const isLoading = authLoading || loadingProfile;

  const isStaff = profile && (profile.role === "admin" || profile.role === "teacher");

  // Load shared reference data (terms, subjects)
  useEffect(() => {
    if (!profile) return;

    const loadMeta = async () => {
      const [{ data: termData }, { data: subjectData }] = await Promise.all([
        supabase.from("terms").select("id, name").order("created_at", { ascending: true }),
        supabase.from("subjects").select("id, name, class").order("name", { ascending: true }),
      ]);

      setTerms((termData as Term[]) || []);
      setSubjects((subjectData as Subject[]) || []);
    };

    loadMeta();
  }, [profile]);

  const classesFromStudents = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.class) set.add(s.class);
    });
    return Array.from(set).sort();
  }, [students]);

  // For staff: when term/class/subject selection changes, load students + results + CGPA
  useEffect(() => {
    if (!isStaff) return;
    if (!selectedTermId || !selectedClass || !selectedSubjectId) return;

    const loadData = async () => {
      setLoadingData(true);
      setLoadError(null);
      setSaveSuccess(null);

      // 1) Load students for the selected class
      const { data: studentRows, error: studentsError } = await supabase
        .from("students")
        .select("id, name, roll_no, email, class")
        .eq("class", selectedClass)
        .order("roll_no", { ascending: true });

      if (studentsError) {
        setLoadError("Unable to load students for the selected class.");
        setLoadingData(false);
        return;
      }

      const studentList = (studentRows as StudentRow[]) || [];
      setStudents(studentList);

      if (!studentList.length) {
        setMarksByStudent({});
        setCgpaByStudent({});
        setLoadingData(false);
        return;
      }

      const studentIds = studentList.map((s) => s.id);

      // 2) Load existing marks for this term + subject + these students
      const { data: resultRows } = await supabase
        .from("results")
        .select("id, student_id, subject_id, term_id, marks_obtained, max_marks")
        .eq("term_id", selectedTermId)
        .eq("subject_id", selectedSubjectId)
        .in("student_id", studentIds);

      const resultList = (resultRows as ResultRow[]) || [];

      // 3) Load existing CGPA for this term + these students
      const { data: cgpaRows } = await supabase
        .from("term_cgpa")
        .select("id, student_id, term_id, cgpa")
        .eq("term_id", selectedTermId)
        .in("student_id", studentIds);

      const cgpaList = (cgpaRows as TermCgpaRow[]) || [];

      const marksMap: Record<string, EditableMark> = {};
      const cgpaMap: Record<string, EditableCgpa> = {};

      studentList.forEach((s) => {
        const r = resultList.find((row) => row.student_id === s.id) || null;
        marksMap[s.id] = {
          resultId: r ? r.id : null,
          marksObtained: r ? String(r.marks_obtained ?? "") : "",
          maxMarks: r ? String(r.max_marks ?? "") : "",
        };

        const c = cgpaList.find((row) => row.student_id === s.id) || null;
        cgpaMap[s.id] = {
          rowId: c ? c.id : null,
          value: c ? String(c.cgpa ?? "") : "",
        };
      });

      setMarksByStudent(marksMap);
      setCgpaByStudent(cgpaMap);

      setLoadingData(false);
    };

    loadData();
  }, [isStaff, selectedTermId, selectedClass, selectedSubjectId]);

  const handleSave = async () => {
    if (!isStaff || !students.length || !selectedTermId || !selectedSubjectId) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Save/update results for each student
      for (const s of students) {
        const mark = marksByStudent[s.id];
        if (!mark) continue;

        const marksObtained = mark.marksObtained.trim();
        const maxMarks = mark.maxMarks.trim();

        if (!marksObtained || !maxMarks) {
          // Skip empty rows for now
          continue;
        }

        const mo = Number(marksObtained);
        const mm = Number(maxMarks);
        if (Number.isNaN(mo) || Number.isNaN(mm)) continue;

        if (mark.resultId) {
          await supabase
            .from("results")
            .update({ marks_obtained: mo, max_marks: mm })
            .eq("id", mark.resultId);
        } else {
          const { data: inserted } = await supabase
            .from("results")
            .insert({
              student_id: s.id,
              subject_id: selectedSubjectId,
              term_id: selectedTermId,
              marks_obtained: mo,
              max_marks: mm,
            })
            .select("id")
            .single();

          if (inserted) {
            setMarksByStudent((prev) => ({
              ...prev,
              [s.id]: {
                ...prev[s.id],
                resultId: inserted.id as string,
              },
            }));
          }
        }
      }

      // Save/update CGPA per student/term
      for (const s of students) {
        const cg = cgpaByStudent[s.id];
        if (!cg || !cg.value.trim()) continue;
        const value = Number(cg.value.trim());
        if (Number.isNaN(value)) continue;

        await supabase
          .from("term_cgpa")
          .upsert(
            {
              id: cg.rowId ?? undefined,
              student_id: s.id,
              term_id: selectedTermId,
              cgpa: value,
            },
            { onConflict: "student_id,term_id" }
          );
      }

      setSaveSuccess("Results saved successfully.");
    } catch (err) {
      setSaveError("Failed to save results. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (!students.length || !selectedTermId || !selectedSubjectId) return;

    const header = [
      "student_id",
      "name",
      "class",
      "roll_no",
      "subject_id",
      "term_id",
      "marks_obtained",
      "max_marks",
      "cgpa_term",
    ];

    const rows: string[] = [];
    rows.push(header.join(","));

    students.forEach((s) => {
      const mark = marksByStudent[s.id];
      const cg = cgpaByStudent[s.id];

      const mo = mark?.marksObtained?.trim() ?? "";
      const mm = mark?.maxMarks?.trim() ?? "";
      const cgval = cg?.value?.trim() ?? "";

      const values = [
        s.id,
        s.name,
        s.class ?? "",
        s.roll_no ?? "",
        selectedSubjectId,
        selectedTermId,
        mo,
        mm,
        cgval,
      ];

      // basic CSV escaping: wrap values containing commas or quotes in quotes
      const escaped = values.map((v) => {
        const str = String(v ?? "");
        if (str.includes(",") || str.includes("\"")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });

      rows.push(escaped.join(","));
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-");
    a.download = `results-${selectedClass || "class"}-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = (file: File | null) => {
    if (!file || !students.length) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (!lines.length) {
          setImportError("CSV file is empty.");
          return;
        }

        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const idxRoll = header.indexOf("roll_no");
        const idxEmail = header.indexOf("email");
        const idxMarks = header.indexOf("marks_obtained");
        const idxMax = header.indexOf("max_marks");
        const idxCgpa = header.indexOf("cgpa_term");

        if (idxMarks === -1 || idxMax === -1) {
          setImportError("CSV must include at least marks_obtained and max_marks columns.");
          return;
        }

        if (idxRoll === -1 && idxEmail === -1) {
          setImportError("CSV must include roll_no and/or email column to match students.");
          return;
        }

        const byRoll = new Map<string, StudentRow>();
        const byEmail = new Map<string, StudentRow>();
        students.forEach((s) => {
          if (s.roll_no) byRoll.set(s.roll_no.trim().toLowerCase(), s);
          if (s.email) byEmail.set(s.email.trim().toLowerCase(), s);
        });

        const newMarks: Record<string, EditableMark> = { ...marksByStudent };
        const newCgpa: Record<string, EditableCgpa> = { ...cgpaByStudent };

        for (let i = 1; i < lines.length; i++) {
          const raw = lines[i];
          if (!raw) continue;

          const cols = raw.split(",");
          const rollVal = idxRoll !== -1 ? cols[idxRoll]?.trim() : "";
          const emailVal = idxEmail !== -1 ? cols[idxEmail]?.trim() : "";

          let student: StudentRow | undefined;
          if (rollVal) {
            student = byRoll.get(rollVal.toLowerCase());
          }
          if (!student && emailVal) {
            student = byEmail.get(emailVal.toLowerCase());
          }
          if (!student) continue;

          const marksVal = cols[idxMarks]?.trim() ?? "";
          const maxVal = cols[idxMax]?.trim() ?? "";
          const cgVal = idxCgpa !== -1 ? cols[idxCgpa]?.trim() ?? "" : "";

          newMarks[student.id] = {
            resultId: newMarks[student.id]?.resultId ?? null,
            marksObtained: marksVal,
            maxMarks: maxVal,
          };

          if (cgVal) {
            newCgpa[student.id] = {
              rowId: newCgpa[student.id]?.rowId ?? null,
              value: cgVal,
            };
          }
        }

        setMarksByStudent(newMarks);
        setCgpaByStudent(newCgpa);
      } catch (err) {
        setImportError("Failed to import CSV. Please check the format.");
      }
    };

    reader.onerror = () => {
      setImportError("Unable to read CSV file.");
    };

    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    // Provide headers plus a few example lines for the current class
    const header = ["roll_no", "email", "marks_obtained", "max_marks", "cgpa_term"]; // cgpa_term optional

    const sampleRows: string[] = [];
    sampleRows.push(header.join(","));

    // Use up to first 3 students from this class as examples, otherwise generic placeholders
    const exampleStudents = students.slice(0, 3);
    if (exampleStudents.length > 0) {
      exampleStudents.forEach((s) => {
        sampleRows.push([
          s.roll_no || "1",
          s.email || "student@example.com",
          "80",
          "100",
          "8.5",
        ].join(","));
      });
    } else {
      sampleRows.push("1,student1@example.com,80,100,8.5");
      sampleRows.push("2,student2@example.com,75,100,8.0");
    }

    const csvContent = sampleRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sample-results-${selectedClass || "class"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Student view: show own marks and CGPA
  const [studentResults, setStudentResults] = useState<
    Array<{
      termId: string;
      termName: string;
      subjectName: string;
      marksObtained: number;
      maxMarks: number;
    }>
  >([]);
  const [studentCgpa, setStudentCgpa] = useState<Array<{ termId: string; termName: string; cgpa: number }>>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);

  useEffect(() => {
    const loadStudentView = async () => {
      if (!profile || profile.role !== "student" || !profile.email) return;

      setLoadingStudent(true);

      // 1) Find student row by email
      const { data: studentRow } = await supabase
        .from("students")
        .select("id, class")
        .eq("email", profile.email)
        .maybeSingle();

      const studentId = (studentRow as any)?.id as string | undefined;
      if (!studentId) {
        setLoadingStudent(false);
        return;
      }

      // 2) Load all results for this student
      const { data: resultRows } = await supabase
        .from("results")
        .select("id, student_id, subject_id, term_id, marks_obtained, max_marks")
        .eq("student_id", studentId);

      const resultList = (resultRows as ResultRow[]) || [];

      if (!resultList.length) {
        setStudentResults([]);
        setLoadingStudent(false);
        return;
      }

      // 3) Load all terms and subjects needed
      const termIds = Array.from(new Set(resultList.map((r) => r.term_id)));
      const subjectIds = Array.from(new Set(resultList.map((r) => r.subject_id)));

      const [{ data: termRows }, { data: subjectRows }] = await Promise.all([
        supabase.from("terms").select("id, name").in("id", termIds),
        supabase.from("subjects").select("id, name").in("id", subjectIds),
      ]);

      const termMap = new Map<string, string>();
      (termRows as Term[] | null)?.forEach((t) => termMap.set(t.id, t.name));

      const subjectMap = new Map<string, string>();
      (subjectRows as Subject[] | null)?.forEach((s) => subjectMap.set(s.id, s.name));

      const formatted = resultList.map((r) => ({
        termId: r.term_id,
        termName: termMap.get(r.term_id) ?? "",
        subjectName: subjectMap.get(r.subject_id) ?? "",
        marksObtained: r.marks_obtained,
        maxMarks: r.max_marks,
      }));

      setStudentResults(formatted);

      // 4) Load CGPA
      const { data: cgpaRows } = await supabase
        .from("term_cgpa")
        .select("student_id, term_id, cgpa")
        .eq("student_id", studentId);

      const cgList = (cgpaRows as TermCgpaRow[]) || [];
      const studentCg: Array<{ termId: string; termName: string; cgpa: number }> = [];
      cgList.forEach((row) => {
        studentCg.push({
          termId: row.term_id,
          termName: termMap.get(row.term_id) ?? "",
          cgpa: row.cgpa,
        });
      });

      setStudentCgpa(studentCg);
      setLoadingStudent(false);
    };

    loadStudentView();
  }, [profile]);

  // Admin/Teacher helper data derived from subjects / selections
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => {
      if (s.class) set.add(s.class);
    });
    return Array.from(set).sort();
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    return subjects.filter((s) => !s.class || s.class === selectedClass);
  }, [subjects, selectedClass]);

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
        <div className="max-w-5xl mx-auto text-sm text-slate-500">Loading results...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl bg-white shadow-lg border border-rose-100 px-6 py-4 text-sm text-rose-700 max-w-sm text-center">
          <p className="font-semibold mb-1">Profile not found</p>
          <p className="text-xs text-rose-600/80">Try signing out and registering again so we can create your profile.</p>
        </div>
      </main>
    );
  }

  // Student view
  if (profile.role === "student") {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Results</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your marks &amp; CGPA</h1>
              <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
                View your term-wise subject marks and overall CGPA shared by your school.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.print();
                }
              }}
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-white/20 border border-white/20"
            >
              Print / Save as PDF
            </button>
          </header>

          {loadingStudent && (
            <p className="text-xs text-slate-500">Loading your results...</p>
          )}

          {!loadingStudent && studentResults.length === 0 && (
            <p className="text-sm text-slate-600">No results have been published for your account yet.</p>
          )}

          {!loadingStudent && studentResults.length > 0 && (
            <div className="space-y-4">
              {Array.from(new Set(studentResults.map((r) => r.termId))).map((termId) => {
                const termName = studentResults.find((r) => r.termId === termId)?.termName || "";
                const termRows = studentResults.filter((r) => r.termId === termId);
                const termCg = studentCgpa.find((c) => c.termId === termId);

                return (
                  <section key={termId} className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold text-slate-900">{termName || "Term"}</h2>
                      {termCg && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                          CGPA: {termCg.cgpa}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto text-xs">
                      <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Subject</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-700">Marks</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-700">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {termRows.map((row, idx) => {
                            const pct = row.maxMarks ? (row.marksObtained / row.maxMarks) * 100 : 0;
                            return (
                              <tr key={idx} className="border-t border-slate-200">
                                <td className="px-3 py-2 text-slate-800">{row.subjectName || "Subject"}</td>
                                <td className="px-3 py-2 text-right text-slate-700">
                                  {row.marksObtained} / {row.maxMarks}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-700">{pct.toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Results management</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Student marks &amp; CGPA</h1>
          <p className="mt-1 text-sm text-indigo-100/90 max-w-xl">
            Select a term, class, and subject to enter or update marks and overall CGPA for each student.
          </p>
        </header>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-4 text-xs">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="block font-medium text-slate-800">Term</label>
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select term</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-slate-800">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSubjectId("");
                  setMarksByStudent({});
                  setCgpaByStudent({});
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select class</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-slate-800">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select subject</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.class ? ` (${s.class})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadError && <p className="text-xs text-rose-600">{loadError}</p>}

          {selectedTermId && selectedClass && selectedSubjectId && !loadError && (
            <>
              {loadingData && <p className="text-xs text-slate-500">Loading students and existing marks...</p>}

              {!loadingData && !students.length && (
                <p className="text-xs text-slate-600">No students found for this class.</p>
              )}

              {!loadingData && students.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-600">
                      Enter marks and CGPA, then click <span className="font-semibold">Save results</span> or
                      export the table as CSV. You can also import values from a CSV file.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadSampleCsv}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Download sample CSV
                      </button>
                      <label className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => handleImportCsv(e.target.files?.[0] ?? null)}
                        />
                        Import CSV
                      </label>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-[11px] font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save results"}
                      </button>
                    </div>
                  </div>

                  {importError && <p className="text-xs text-rose-600">{importError}</p>}

                  {saveError && <p className="text-xs text-rose-600">{saveError}</p>}
                  {saveSuccess && <p className="text-xs text-emerald-700">{saveSuccess}</p>}

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Roll</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Email</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Marks obtained</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Max marks</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">CGPA (term)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const mark = marksByStudent[s.id] || {
                            resultId: null,
                            marksObtained: "",
                            maxMarks: "",
                          };
                          const cg = cgpaByStudent[s.id] || {
                            rowId: null,
                            value: "",
                          };

                          return (
                            <tr key={s.id} className="border-t border-slate-200">
                              <td className="px-3 py-2 text-xs text-slate-700">{s.roll_no || "-"}</td>
                              <td className="px-3 py-2 text-xs text-slate-800">{s.name}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{s.email || "-"}</td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  value={mark.marksObtained}
                                  onChange={(e) =>
                                    setMarksByStudent((prev) => ({
                                      ...prev,
                                      [s.id]: {
                                        ...(prev[s.id] || { resultId: mark.resultId, maxMarks: mark.maxMarks }),
                                        marksObtained: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  value={mark.maxMarks}
                                  onChange={(e) =>
                                    setMarksByStudent((prev) => ({
                                      ...prev,
                                      [s.id]: {
                                        ...(prev[s.id] || { resultId: mark.resultId, marksObtained: mark.marksObtained }),
                                        maxMarks: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={cg.value}
                                  onChange={(e) =>
                                    setCgpaByStudent((prev) => ({
                                      ...prev,
                                      [s.id]: {
                                        ...(prev[s.id] || { rowId: cg.rowId }),
                                        value: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
