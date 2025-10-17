"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../store/auth/useAuth";
import { useUiStore } from "../store/useUiStore";
import { useMockAuth } from "../store/auth/useMockAuth";
import { usePathname, useRouter } from "next/navigation";


interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({
  children,
}: AuthGuardProps) {
  const { user } = useAuth();
  const { mockUser , hydrated } = useMockAuth();
  const loading = useUiStore().isLoading("loadingSession");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if(hydrated && !mockUser){
        router.replace(`/?redirect=${encodeURIComponent(pathname)}`);
    }
  },[hydrated , mockUser , router , pathname]);
  
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }


  if (!mockUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  // Render children เมื่อผ่านเงื่อนไข authentication
  return <>{children}</>;
}
