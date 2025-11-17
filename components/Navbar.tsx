"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase-client";

type SessionUser = {
  id?: string;
  email?: string | null;
  role?: string | null;
  name?: string | null;
  image?: string | null;
};

export default function Navbar({ brand = "SchoolMgmt" }: { brand?: string }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hasNewEvents, setHasNewEvents] = useState(false);
  const pathname = usePathname();

  // Build callbackUrl so users return to current page after sign-in
  const callbackUrl = typeof pathname === "string" && pathname !== "/" ? pathname : "/dashboard";
  const signinHref = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const role = (user?.role ?? "").toString();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authUser = session?.user;
      if (!authUser) {
        setUser(null);
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email,
        role: (authUser.user_metadata as any)?.role ?? null,
        name: (authUser.user_metadata as any)?.name ?? null,
        image: (authUser.user_metadata as any)?.avatar_url ?? null,
      });
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if there are any events that this user hasn't seen yet.
  // For signed-in users, we compare latest event created_at with their last_seen_at in event_views.
  // For guests, we fall back to simple "any event in last 7 days" logic.
  useEffect(() => {
    const checkNewEvents = async () => {
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

      // If no user, just show badge when there is a recent event
      if (!user?.id) {
        setHasNewEvents(diffDays <= 7);
        return;
      }

      // For signed-in users, check last seen timestamp
      const { data: viewRow } = await supabase
        .from("event_views")
        .select("last_seen_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const lastSeenStr = (viewRow as any)?.last_seen_at as string | undefined;
      const lastSeen = lastSeenStr ? new Date(lastSeenStr) : null;

      // If never seen, treat as new (but still only within 7 days)
      if (!lastSeen) {
        setHasNewEvents(diffDays <= 7);
        return;
      }

      const isUnseen = latestCreated > lastSeen;
      setHasNewEvents(isUnseen && diffDays <= 7);
    };

    checkNewEvents();
  }, [user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const markEventsSeen = async () => {
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

  const avatarContent = () => {
    if (user?.image) {
      return (
        <Image
          src={user.image}
          alt={user.name || "User avatar"}
          width={36}
          height={36}
          className="rounded-full object-cover"
        />
      );
    }
    const initials = (user?.name || "U")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
        {initials}
      </div>
    );
  };

  return (
    <header className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3" aria-label="Home">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                {brand[0]}
              </div>
              <span className="font-bold text-lg">{brand}</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/courses" className="hover:underline">
                Courses
              </Link>
              <Link href="/admission" className="hover:underline">
                Admission
              </Link>
              <Link
                href="/events"
                onClick={markEventsSeen}
                className="hover:underline inline-flex items-center gap-1"
              >
                <span>Events</span>
                {hasNewEvents && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    New
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Auth buttons */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {role && (
                  <span className="uppercase text-xs tracking-wider bg-white/20 px-2 py-1 rounded text-white/90">
                    {role}
                  </span>
                )}
                <Link
                  href="/dashboard"
                  className="px-3 py-1 text-sm rounded hover:bg-white/10"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-600 transition-colors"
                >
                  Sign out
                </button>
                {avatarContent()}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                {/* Sign in -> page with callbackUrl */}
                <Link
                  href={signinHref}
                  className="px-3 py-1 border rounded text-sm bg-white/10"
                >
                  Sign in
                </Link>

                {/* Apply -> Register page */}
                <Link
                  href="/auth/register"
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                >
                  Apply
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-expanded={open}
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    open
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t bg-gradient-to-br from-indigo-700 to-indigo-900 text-white shadow-lg"
          >
            <div className="px-4 py-3 space-y-2">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded hover:bg-indigo-800/50 transition"
              >
                Home
              </Link>

              <Link
                href="/courses"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded hover:bg-indigo-800/50 transition"
              >
                Courses
              </Link>

              <Link
                href="/admission"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded hover:bg-indigo-800/50 transition"
              >
                Admission
              </Link>

              <Link
                href="/events"
                onClick={async () => {
                  setOpen(false);
                  await markEventsSeen();
                }}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-indigo-800/50 transition"
              >
                <span>Events</span>
                {hasNewEvents && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    New
                  </span>
                )}
              </Link>

              <div className="border-t pt-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2">
                      {avatarContent()}
                      <div>
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-xs text-indigo-200">{user?.email}</div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="block px-2 py-2 rounded hover:bg-indigo-800/50"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          setOpen(false);
                          await handleSignOut();
                        }}
                        className="w-full text-left px-2 py-2 rounded hover:bg-indigo-800/50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {/* Mobile Sign in -> page with callbackUrl */}
                    <Link
                      href={signinHref}
                      onClick={() => setOpen(false)}
                      className="w-full block text-left px-2 py-2 rounded hover:bg-indigo-800/50"
                    >
                      Sign in
                    </Link>

                    {/* Mobile Apply -> Register */}
                    <Link
                      href="/auth/register"
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded hover:bg-indigo-800/50"
                    >
                      Apply
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
