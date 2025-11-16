"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // When Supabase finishes email confirmation, it may redirect to the root URL
    // with an auth hash (e.g. #access_token=...). In that case, send the user
    // to the signin page with a verified flag so they see the success message.
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      if (hash.includes("access_token") || hash.includes("type=signup")) {
        router.replace("/auth/signin?verified=1");
      }
    }
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center">
      {/* HERO SECTION */}
      <section className="w-full py-24 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto px-4"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6">
            Welcome to <span className="text-yellow-300">SchoolMgmt</span>
          </h1>
          <p className="text-lg sm:text-xl mb-8 text-indigo-100">
            A modern School & College Management System for smarter administration,
            seamless communication, and student success.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/admission"
              className="px-6 py-3 bg-yellow-400 text-indigo-900 rounded-lg font-semibold hover:bg-yellow-300 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-white rounded-lg font-semibold hover:bg-white hover:text-indigo-700 transition"
            >
              Admin Dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section className="w-full max-w-6xl mx-auto py-20 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-12 text-gray-800"
        >
          Why Choose SchoolMgmt?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              title: "For Students",
              desc: "Easily check your classes, grades, and attendance all in one place.",
              icon: "🎓",
            },
            {
              title: "For Teachers",
              desc: "Simplify assignments, track student progress, and manage schedules efficiently.",
              icon: "👩‍🏫",
            },
            {
              title: "For Admins",
              desc: "A full control dashboard for admissions, courses, staff, and reports.",
              icon: "🧭",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg text-center border border-gray-100"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-700">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="w-full bg-indigo-50 py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-indigo-800"
          >
            Empowering Education with Technology
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto"
          >
            SchoolMgmt bridges the gap between teachers, students, and administrators.
            Manage admissions, schedules, results, and communications — all in one
            secure and intuitive platform.
          </motion.p>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 text-center bg-gradient-to-br from-indigo-700 to-indigo-900 text-white w-full">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-6"
        >
          Ready to Experience the Future of School Management?
        </motion.h2>
        <Link
          href="/dashboard"
          className="px-8 py-3 bg-yellow-400 text-indigo-900 font-semibold rounded-lg hover:bg-yellow-300 transition"
        >
          Go to Dashboard
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t w-full">
        © {new Date().getFullYear()} SchoolMgmt. All rights reserved.
      </footer>
    </main>
  );
}
