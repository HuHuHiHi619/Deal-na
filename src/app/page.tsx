"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import LoginButton from "./component/button/LoginButton";
import EmailLoginForm from "./component/auth/EmailLoginForm";
import DevQuickLogin from "./component/auth/DevQuickLogin";
import Confetti from "./component/decor/Confetti";
import { useAuth } from "./store/auth/useAuth";
import { useUiStore } from "./store/useUiStore";

export default function Home() {
  const user = useAuth(state => state.user);
  const loadingSession = useUiStore(state => state.loading.loadingSession);
  const router = useRouter();

  useEffect(() => {
    if (loadingSession || !user) return;
    const raw = new URLSearchParams(window.location.search).get('redirect') ?? '/room';
    try {
      const parsed = new URL(raw, window.location.origin);
      router.replace(parsed.origin === window.location.origin
        ? parsed.pathname + parsed.search + parsed.hash
        : '/room'
      );
    } catch {
      router.replace('/room');
    }
  }, [user, loadingSession, router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-[22px] py-8 bg-cream overflow-hidden">
      <Confetti variant="login" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <h1 className="type-display flex items-center justify-center gap-3">
            <span className="text-coral">deal</span>
            <span className="flex h-14 w-14 -rotate-6 items-center justify-center rounded-full bg-coral">
              <Heart size={26} className="text-white" fill="currentColor" />
            </span>
            <span className="text-ink">na</span>
          </h1>
          <p className="type-body text-muted">
            gather the crew. pick a thing. done.
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card rounded-3xl shadow-lg p-8">
          <EmailLoginForm />
        </div>

        {/* Social */}
        <div className="space-y-4">
          <p className="type-caption text-center text-muted">or hop in with</p>
          <LoginButton />
          <DevQuickLogin />
        </div>

        {/* Footer */}
        <p className="type-caption text-center text-muted">
          new here?{" "}
          <span className="text-coral cursor-pointer">make an account</span>
        </p>
      </div>
    </div>
  );
}
