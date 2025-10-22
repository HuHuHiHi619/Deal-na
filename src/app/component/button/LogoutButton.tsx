"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../store/auth/useAuth";
import { useAsyncAction } from "../../hooks/useAsyncAction";

export default function LogoutButton() {
  const { signOut } = useAuth();
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
      return await signOut();
    });
  };
  return (
    <button
      className="bg-rose-700 text-white p-4 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleLogout}
      disabled={isLoading}
    >
      Logout
    </button>
  );
}
