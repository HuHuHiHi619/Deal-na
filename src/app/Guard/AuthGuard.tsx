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
    if (loading.loadingSession) {
      return;
    }

    if (!user && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      console.log("AuthGuard: No user found. Redirecting to login.");
      router.replace(`/?redirect=${encodeURIComponent(pathname)}`);
    }

    
    if (user) {
      hasRedirectedRef.current = false;
    }
  }, [user, loading.loadingSession, router, pathname]);

  
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

  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  
  return <>{children}</>;
}