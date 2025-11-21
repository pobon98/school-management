"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase-client";

export default function DashboardResultsLink() {
  const [hasNewResults, setHasNewResults] = useState(false);

  useEffect(() => {
    const checkNewResults = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user?.email) {
        setHasNewResults(false);
        return;
      }

      // Find the corresponding student row for this user
      const { data: studentRow } = await supabase
        .from("students")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      const studentId = (studentRow as any)?.id as string | undefined;
      if (!studentId) {
        setHasNewResults(false);
        return;
      }

      // Latest result row for this student
      const { data: latestResults } = await supabase
        .from("results")
        .select("updated_at, created_at")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!latestResults || !latestResults.length) {
        setHasNewResults(false);
        return;
      }

      const latest = latestResults[0] as any;
      const latestTimestampStr = (latest.updated_at as string) || (latest.created_at as string);
      if (!latestTimestampStr) {
        setHasNewResults(false);
        return;
      }

      const latestTimestamp = new Date(latestTimestampStr);
      const now = new Date();
      const diffDays = (now.getTime() - latestTimestamp.getTime()) / (1000 * 60 * 60 * 24);

      if (!user.id) {
        setHasNewResults(diffDays <= 7);
        return;
      }

      // Per-user last seen for results
      const { data: viewRow } = await supabase
        .from("result_views")
        .select("last_seen_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const lastSeenStr = (viewRow as any)?.last_seen_at as string | undefined;
      const lastSeen = lastSeenStr ? new Date(lastSeenStr) : null;

      if (!lastSeen) {
        setHasNewResults(diffDays <= 7);
        return;
      }

      const isUnseen = latestTimestamp > lastSeen;
      setHasNewResults(isUnseen && diffDays <= 7);
    };

    checkNewResults();
  }, []);

  const markSeen = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user?.id) return;

    setHasNewResults(false);

    await supabase
      .from("result_views")
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
      href="/dashboard/results"
      onClick={markSeen}
      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-[11px]">
        R
      </span>
      <span className="flex items-center gap-2">
        <span>Results</span>
        {hasNewResults && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            New
          </span>
        )}
      </span>
    </Link>
  );
}
