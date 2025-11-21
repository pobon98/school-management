"use client";

import { useState } from "react";

export default function AdmissionForm() {
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const nextErrors: { [key: string]: string } = {};

    if (!studentName.trim()) {
      nextErrors.studentName = "Please enter the student's name.";
    }

    if (!email.trim()) {
      nextErrors.email = "Please enter an email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!grade.trim()) {
      nextErrors.grade = "Please mention the class / grade.";
    }

    if (message.trim().length < 10) {
      nextErrors.message = "Please provide a short message (at least 10 characters).";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/admission-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName,
          email,
          grade,
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setSubmitError(data?.error || "Unable to send your inquiry right now. Please try again later.");
        return;
      }

      setSuccess("Thank you for your interest. Our admissions team will contact you soon.");
      setStudentName("");
      setEmail("");
      setGrade("");
      setMessage("");
      setErrors({});
    } catch (error) {
      setSubmitError("Unable to send your inquiry right now. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-6">
      <h2 className="text-sm font-semibold text-slate-900">Express your interest</h2>
      <p className="mt-1 text-xs text-slate-600">
        Share a few details and we will get back to you with admission guidance and next steps.
      </p>

      {submitError && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {submitError}
        </div>
      )}

      {success && (
        <div className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
        <div className="space-y-1">
          <label htmlFor="studentName" className="block font-medium text-slate-800">
            Student name
          </label>
          <input
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/60 focus:bg-white transition-colors"
            placeholder="Enter student's full name"
          />
          {errors.studentName && (
            <p className="text-[11px] text-red-600 mt-0.5">{errors.studentName}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block font-medium text-slate-800">
            Parent / guardian email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/60 focus:bg-white transition-colors"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-[11px] text-red-600 mt-0.5">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="grade" className="block font-medium text-slate-800">
            Class / grade seeking admission to
          </label>
          <input
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/60 focus:bg-white transition-colors"
            placeholder="e.g. Grade 3, Class 7, etc."
          />
          {errors.grade && <p className="text-[11px] text-red-600 mt-0.5">{errors.grade}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="message" className="block font-medium text-slate-800">
            Message
          </label>
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/60 focus:bg-white transition-colors resize-none"
            placeholder="Share any specific questions or details about the student."
          />
          {errors.message && <p className="text-[11px] text-red-600 mt-0.5">{errors.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit interest"}
        </button>
      </form>
    </section>
  );
}