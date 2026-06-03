"use client";

import { supabase } from "@/app/lib/supabase";
import React, { useState } from "react";

/** Email + password login form (Supabase signInWithPassword). */
export default function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const THROTTLE_MS = 2000;

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < THROTTLE_MS) {
      setError("Please wait before submitting another login");
      return;
    }

    setLastSubmitTime(now);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) window.location.href = getRedirectPath();
      else {
        console.error(error.message);
        setError(error.message);
      }
    } catch (err: unknown) {
      console.error("Login with email error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    }
  };

  const labelClass = "type-eyebrow block text-muted mb-2";
  const inputClass =
    "type-body w-full px-4 py-3 rounded-lg border border-line bg-cream text-ink placeholder-muted/60 focus:outline-none focus:border-coral transition-colors duration-200";

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      <div>
        <label htmlFor="login-email" className={labelClass}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="june@crew.app"
          value={email}
          onChange={(e) => {
            setError(null);
            setEmail(e.target.value);
          }}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="login-password" className={labelClass}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setError(null);
            setPassword(e.target.value);
          }}
          className={inputClass}
        />
      </div>

      {error && <p className="type-caption text-coral">{error}</p>}

      <button
        type="submit"
        className="bg-brand-gradient type-heading w-full py-3.5 rounded-xl text-white shadow-glow-coral cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
      >
        Let&apos;s go →
      </button>
    </form>
  );
}
