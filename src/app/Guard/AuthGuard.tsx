"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useAuth } from "../store/auth/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "../store/useUiStore";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user } = useAuth();
  const { loading } = useUiStore();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // 1. Do nothing until the initial session check is complete.
    if (loading.loadingSession) {
      return;
    }

    // 2. Session check is done. If there's no user, redirect.
    if (!user && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      console.log("AuthGuard: No user found. Redirecting to login.");
      router.replace(`/?redirect=${encodeURIComponent(pathname)}`);
    }

    // 3. If a user exists, reset the ref for any future logouts.
    if (user) {
      hasRedirectedRef.current = false;
    }
  }, [user, loading.loadingSession, router, pathname]);

  // 1. Show a full-page spinner while the session is being checked.
  if (loading.loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  // 2. Session is loaded, but no user. The useEffect is handling the redirect.
  // Show a simple placeholder.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  // 3. Session is loaded AND we have a user. Show the protected content.
  return <>{children}</>;
}