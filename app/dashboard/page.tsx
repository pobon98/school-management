'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-client';
import { useAuthRedirect } from '../../lib/useAuthRedirect';

interface Profile {
  email: string | null;
  role: 'admin' | 'teacher' | 'student';
}

function AdminPanel() {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
          A
        </span>
        Admin Panel
      </h2>
      <p className="text-sm text-slate-600">
        Manage teachers, students, and system settings for the entire school.
      </p>
    </div>
  );
}

function TeacherPanel() {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
          T
        </span>
        Teacher Panel
      </h2>
      <p className="text-sm text-slate-600">
        Manage your classes, attendance, and grades for your students.
      </p>
    </div>
  );
}

function StudentPanel() {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
          S
        </span>
        Student Panel
      </h2>
      <p className="text-sm text-slate-600">
        View your classes, marks, and attendance in one place.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { loading: authLoading, user } = useAuthRedirect();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile({
          email: data.email ?? '',
          role: data.role as Profile['role'],
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, [user]);

  if (authLoading || loading)
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 shadow-sm border border-slate-200">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm text-slate-700">Loading your dashboard...</span>
        </div>
      </main>
    );

  if (!profile)
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl bg-white shadow-lg border border-rose-100 px-6 py-4 text-sm text-rose-700 max-w-sm text-center">
          <p className="font-semibold mb-1">Profile not found</p>
          <p className="text-xs text-rose-600/80">Try signing out and registering again so we can create your profile.</p>
        </div>
      </main>
    );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero header */}
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your school dashboard</h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
              Quickly see your role, important panels, and key information about the school.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs text-indigo-50 space-y-1 border border-white/15">
            <div className="flex items-center justify-between gap-6">
              <span className="uppercase tracking-wide text-[11px] text-indigo-100/80">Signed in as</span>
              <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded-full capitalize">
                {profile.role}
              </span>
            </div>
            <p className="text-[11px] break-all">{profile.email}</p>
          </div>
        </header>

        {/* Stats row */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Today</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">12</p>
            <p className="mt-1 text-xs text-slate-500">Classes running</p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Students</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">320</p>
            <p className="mt-1 text-xs text-slate-500">Active students in the system</p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Events</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">5</p>
            <p className="mt-1 text-xs text-slate-500">Upcoming school events</p>
          </div>
        </section>

        {/* Main content section */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.3fr)] items-start">
          <div className="space-y-4">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5">
              {profile.role === 'admin' && <AdminPanel />}
              {profile.role === 'teacher' && <TeacherPanel />}
              {profile.role === 'student' && <StudentPanel />}
            </div>
          </div>

          <aside className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Quick tips</h2>
              <p className="mt-1 text-xs text-slate-600">
                Use this dashboard as a starting point for everything you do in school management.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>• Keep profiles up to date so roles and access stay accurate.</li>
              <li>• Use the navigation on the left to jump into students, teachers, or events.</li>
              <li>• Plan upcoming activities early to keep your calendar healthy.</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}
