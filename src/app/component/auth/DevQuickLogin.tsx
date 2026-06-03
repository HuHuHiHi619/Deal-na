"use client";

import { supabase } from "@/app/lib/supabase";

/** Dev-only quick login panel. Renders nothing outside development. */
export default function DevQuickLogin() {
  if (process.env.NODE_ENV !== "development") return null;

  const getRedirectPath = () => {
    const raw = new URLSearchParams(window.location.search).get("redirect") ?? "/room";
    try {
      const parsed = new URL(raw, window.location.origin);
      if (parsed.origin === window.location.origin) return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      /* malformed */
    }
    return "/room";
  };

  const quickLogin = async (email: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: "test123" });
    if (!error) window.location.href = getRedirectPath();
    else console.error(error.message);
  };

  return (
    <div className="mt-6 rounded-xl border border-line bg-sun-tint p-4">
      <p className="type-eyebrow mb-2 text-ink">Quick test login</p>
      <div className="space-y-2">
        {["test1@test.com", "test2@test.com", "test3@test.com"].map((testEmail) => (
          <button
            key={testEmail}
            onClick={() => quickLogin(testEmail)}
            className="type-caption w-full rounded-lg border border-line bg-card p-2 text-left text-ink hover:bg-cream transition-colors"
          >
            {testEmail}
          </button>
        ))}
      </div>
    </div>
  );
}
