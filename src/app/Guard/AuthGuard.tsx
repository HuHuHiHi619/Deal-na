"use client";

import { ReactNode } from "react";
import { useAuth } from "../store/auth/useAuth";
import LoginButton from "../component/Login";
import { useUiStore } from "../store/useUiStore";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({
  children,
  fallback,
  requireAuth = true,
}: AuthGuardProps) {
  const { user } = useAuth();
  const loading = useUiStore().isLoading("authLoading");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return (
      <div>
        {fallback || (
          <div>
            <h2>Authentication required</h2>
            <p>Please login to continue</p>
            <LoginButton />
          </div>
        )}
      </div>
    );
  }
  return <>{children}</>
}
