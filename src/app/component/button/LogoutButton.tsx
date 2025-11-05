"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../store/auth/useAuth";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useMockAuth } from "@/app/store/auth/useMockAuth";

export default function LogoutButton() {
  const { signOut } = useAuth();
  const { mockUser, logout } = useMockAuth();
  const router = useRouter();

  const { execute, isLoading, error } = useAsyncAction("signOut", {
    onSuccess: () => {
      router.push("/");
    },
    onError: (err) => {
      console.log("Logout error:", err);
    },
  });

  const handleLogout = async () => {
    await execute(async () => {
      if (mockUser) {
         logout();
         return
      }
      return await signOut();
    });
  };
  return (
    <div className="flex justify-center my-2">
      {mockUser ? (
        <button
          className="bg-rose-700 text-white p-4 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogout}
          disabled={isLoading}
        >
          mock Logoutz
        </button>
      ) : (
        <button
          className="bg-rose-500 w-full rounded-2xl text-white p-4 cursor-pointer hover:bg-rose-700 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogout}
          disabled={isLoading}
        >
          Logout
        </button>
      )}
    </div>
  );
}
