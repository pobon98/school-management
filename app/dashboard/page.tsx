'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-client';
import { useAuthRedirect } from '../../lib/useAuthRedirect';

interface Profile {
  email: string | null;
  role: 'admin' | 'teacher' | 'student';
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'teachers' | 'students';
  created_at: string;
}

function nameFromEmail(email: string | null): string {
  if (!email) return '';
  const local = email.split('@')[0];
  const parts = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  if (!parts.length) return email;
  return parts.join(' ');
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newAudience, setNewAudience] = useState<'all' | 'teachers' | 'students'>('all');
  const [savingAnn, setSavingAnn] = useState(false);
  const [studentAssignmentCount, setStudentAssignmentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const normalizedRole = (data.role as string | null)?.toLowerCase() as
          | 'admin'
          | 'teacher'
          | 'student'
          | undefined;

        setProfile({
          email: data.email ?? '',
          role: normalizedRole ?? 'student',
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    const loadStudentAssignments = async () => {
      if (!profile || profile.role !== 'student' || !profile.email) return;

      const { data: studentRow } = await supabase
        .from('students')
        .select('class')
        .eq('email', profile.email)
        .maybeSingle();

      const studentClass = (studentRow as any)?.class as string | null;
      if (!studentClass) return;

      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('class', studentClass);

      setStudentAssignmentCount(assignments ? assignments.length : 0);
    };

    loadStudentAssignments();
  }, [profile]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!profile) return;
      setAnnLoading(true);
      setAnnError(null);

      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, body, audience, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        setAnnError('Unable to load announcements right now.');
      } else if (data) {
        setAnnouncements(data as Announcement[]);
      }

      setAnnLoading(false);
    };

    fetchAnnouncements();
  }, [profile]);

  if (authLoading || loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
        <div className="max-w-5xl mx-auto text-sm text-slate-500">Loading dashboard...</div>
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

  const isNonAdmin = profile.role !== 'admin';

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 text-white px-6 py-6 shadow-md flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100/80 mb-1">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {nameFromEmail(profile.email)}
            </h1>
            <p className="mt-1 text-sm text-indigo-100/90 max-w-md">
              Here's a quick overview of what's happening in your school today.
            </p>
          </div>
          <a
            href="/dashboard/assignments"
            className="mt-3 sm:mt-0 inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-amber-700"
          >
            View assignments
          </a>
        </div>

        {/* Student homework banner */}
        {profile.role === 'student' && studentAssignmentCount !== null && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <p className="font-medium">
                You have {studentAssignmentCount} assignment
                {studentAssignmentCount === 1 ? '' : 's'} for your class.
              </p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Check your homework so you don't miss any due dates.
              </p>
            </div>
            <a
              href="/dashboard/assignments"
              className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-amber-700"
            >
              View
            </a>
          </div>
        )}

        {/* Signed-in summary */}
        <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs text-indigo-50 space-y-1 border border-white/15">
          <div className="flex items-center justify-between gap-6">
            <span className="uppercase tracking-wide text-[11px] text-indigo-100/80">Signed in as</span>
            <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded-full capitalize">
              {profile.role}
            </span>
          </div>
          <p className="text-[11px] break-all">{nameFromEmail(profile.email)}</p>
        </div>

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

        {/* Main content + announcements */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.3fr)] items-start">
          <div className="space-y-4">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-6 py-5">
              {profile.role === 'admin' && <AdminPanel />}
              {profile.role === 'teacher' && <TeacherPanel />}
              {profile.role === 'student' && <StudentPanel />}
            </div>
          </div>

          <aside
            className={`rounded-2xl shadow-sm px-6 py-5 space-y-4 border transition-colors ${
              isNonAdmin
                ? 'bg-indigo-50 border-indigo-100'
                : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className={`text-sm font-semibold ${
                    isNonAdmin ? 'text-indigo-900' : 'text-slate-900'
                  }`}
                >
                  Announcements
                </h2>
                <p
                  className={`mt-1 text-xs ${
                    isNonAdmin ? 'text-indigo-700/80' : 'text-slate-600'
                  }`}
                >
                  Important school messages shared by the administration.
                </p>
              </div>
              {isNonAdmin && announcements.length > 0 && (
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-amber-700">New</span>
                </div>
              )}
            </div>

            {profile.role === 'admin' && (
              <div className="rounded-xl border border-slate-200 px-3 py-3 space-y-2 bg-slate-50/70">
                <p className="text-[11px] font-semibold text-slate-700">New announcement</p>
                <input
                  type="text"
                  placeholder="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <textarea
                  placeholder="Message"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as 'all' | 'teachers' | 'students')}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All users</option>
                    <option value="teachers">Teachers</option>
                    <option value="students">Students</option>
                  </select>
                  <button
                    disabled={savingAnn || !newTitle.trim() || !newBody.trim()}
                    onClick={async () => {
                      if (!user) return;
                      setSavingAnn(true);
                      const { error } = await supabase.from('announcements').insert({
                        title: newTitle.trim(),
                        body: newBody.trim(),
                        audience: newAudience,
                        created_by: user.id,
                      });

                      if (!error) {
                        setNewTitle('');
                        setNewBody('');
                        const { data } = await supabase
                          .from('announcements')
                          .select('id, title, body, audience, created_at')
                          .order('created_at', { ascending: false })
                          .limit(5);
                        if (data) setAnnouncements(data as Announcement[]);
                      }

                      setSavingAnn(false);
                    }}
                    className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-medium text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingAnn ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {annLoading && (
                <p className="text-xs text-slate-500">Loading announcements...</p>
              )}
              {annError && !annLoading && (
                <p className="text-xs text-rose-600">{annError}</p>
              )}
              {!annLoading && !annError && (
                <ul className="space-y-2">
                  {announcements
                    .filter((a) => {
                      if (a.audience === 'all') return true;
                      if (a.audience === 'teachers') return profile.role === 'teacher';
                      if (a.audience === 'students') return profile.role === 'student';
                      return false;
                    })
                    .map((a) => (
                      <li
                        key={a.id}
                        className={`rounded-xl px-3 py-2 border relative overflow-hidden ${
                          isNonAdmin
                            ? 'bg-indigo-600/5 border-indigo-200'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        {isNonAdmin && (
                          <span className="absolute inset-y-0 left-0 w-1 bg-indigo-500/80" />
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold text-slate-900 line-clamp-1">
                            {a.title}
                          </p>
                          <span className="text-[10px] uppercase tracking-wide text-slate-400">
                            {a.audience === 'all'
                              ? 'All'
                              : a.audience === 'teachers'
                              ? 'Teachers'
                              : 'Students'}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">{a.body}</p>
                      </li>
                    ))}
                  {announcements.length === 0 && !annLoading && !annError && (
                    <li className="text-xs text-slate-400">No announcements yet.</li>
                  )}
                </ul>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
