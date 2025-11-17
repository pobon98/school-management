"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase-client";

export default function DashboardEventsLink() {
  const [hasNewEvents, setHasNewEvents] = useState(false);

  useEffect(() => {
    const checkNewEvents = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      const { data: latestEvents } = await supabase
        .from("events")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!latestEvents || !latestEvents.length) {
        setHasNewEvents(false);
        return;
      }

      const latestCreated = new Date((latestEvents[0] as any).created_at as string);
      const now = new Date();
      const diffDays = (now.getTime() - latestCreated.getTime()) / (1000 * 60 * 60 * 24);

      if (!user?.id) {
        setHasNewEvents(diffDays <= 7);
        return;
      }

      const { data: viewRow } = await supabase
        .from("event_views")
        .select("last_seen_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const lastSeenStr = (viewRow as any)?.last_seen_at as string | undefined;
      const lastSeen = lastSeenStr ? new Date(lastSeenStr) : null;

      if (!lastSeen) {
        setHasNewEvents(diffDays <= 7);
        return;
      }

      const isUnseen = latestCreated > lastSeen;
      setHasNewEvents(isUnseen && diffDays <= 7);
    };

    checkNewEvents();
  }, []);

  const markSeen = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user?.id) return;

    setHasNewEvents(false);

    await supabase
      .from("event_views")
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
      href="/dashboard/events"
      onClick={markSeen}
      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-[11px]">
        E
      </span>
      <span className="flex items-center gap-2">
        <span>Events</span>
        {hasNewEvents && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            New
          </span>
        )}
      </span>
    </Link>
  );
}
