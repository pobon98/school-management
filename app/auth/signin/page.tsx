import { Suspense } from "react";
import SignInForm from "./SignInForm";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
          <div className="text-sm text-slate-600">Loading sign in...</div>
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
