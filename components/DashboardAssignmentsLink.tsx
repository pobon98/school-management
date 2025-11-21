"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase-client";

export default function DashboardAssignmentsLink() {
  const [hasNewAssignments, setHasNewAssignments] = useState(false);

  useEffect(() => {
    const checkNewAssignments = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user?.email) {
        setHasNewAssignments(false);
        return;
      }

      // Find the student's class from the students table
      const { data: studentRow } = await supabase
        .from("students")
        .select("class")
        .eq("email", user.email)
        .maybeSingle();

      const studentClass = (studentRow as any)?.class as string | null;
      if (!studentClass) {
        setHasNewAssignments(false);
        return;
      }

      // Latest assignment for this class
      const { data: latestAssignments } = await supabase
        .from("assignments")
        .select("created_at")
        .eq("class", studentClass)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!latestAssignments || !latestAssignments.length) {
        setHasNewAssignments(false);
        return;
      }

      const latestCreated = new Date((latestAssignments[0] as any).created_at as string);
      const now = new Date();
      const diffDays = (now.getTime() - latestCreated.getTime()) / (1000 * 60 * 60 * 24);

      // If user not tracked yet, show new if within 7 days
      if (!user.id) {
        setHasNewAssignments(diffDays <= 7);
        return;
      }

      // Check per-user last seen
      const { data: viewRow } = await supabase
        .from("assignment_views")
        .select("last_seen_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const lastSeenStr = (viewRow as any)?.last_seen_at as string | undefined;
      const lastSeen = lastSeenStr ? new Date(lastSeenStr) : null;

      if (!lastSeen) {
        setHasNewAssignments(diffDays <= 7);
        return;
      }

      const isUnseen = latestCreated > lastSeen;
      setHasNewAssignments(isUnseen && diffDays <= 7);
    };

    checkNewAssignments();
  }, []);

  const markSeen = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user?.id) return;

    setHasNewAssignments(false);

    await supabase
      .from("assignment_views")
      .upsert(
        {
          user_id: user.id,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  };

  return (
    <Link
      href="/dashboard/assignments"
      onClick={markSeen}
      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-400/20 text-[11px]">
        A
      </span>
      <span className="flex items-center gap-2">
        <span>Assignments</span>
        {hasNewAssignments && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            New
          </span>
        )}
      </span>
    </Link>
  );
}
