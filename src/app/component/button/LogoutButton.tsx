"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../store/auth/useAuth";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { LogOutIcon } from "lucide-react";

export default function LogoutButton({ mini = false }) {
  const { signOut } = useAuth();
  const router = useRouter();

  const { execute, isLoading  } = useAsyncAction("signOut", {
    onSuccess: () => {
      router.push("/");
    },
    onError: (err) => {
      console.error("Logout error:", err);
    },
  });

  const handleLogout = async () => {
    await execute(async () => {
      return await signOut();
    });
  };
  return (
    <div className="flex justify-center my-2">
      {mini ? (
        <button
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-card text-ink shadow-sm cursor-pointer hover:bg-cream transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogout}
          disabled={isLoading}
          aria-label="Log out"
        >
          <LogOutIcon size={20} />
        </button>
      ) : (
        <button
          className="flex w-full items-center justify-center gap-1.5 py-2 type-caption font-semibold text-muted transition-colors hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOutIcon size={15} />
          {isLoading ? "logging out..." : "log out"}
        </button>
      )}
    </div>
  );
}
