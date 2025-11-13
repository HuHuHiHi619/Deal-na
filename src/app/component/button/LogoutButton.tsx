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
      console.log("Logout error:", err);
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
          className="bg-white  rounded-full text-rose-400 border-2 p-2 cursor-pointer hover:bg-rose-400 hover:text-white transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOutIcon />
        </button>
      ) : (
        <button
          className="flex items-center justify-center gap-2 bg-white w-full rounded-2xl text-rose-300 border-2 p-2 cursor-pointer hover:bg-rose-400 hover:text-white transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOutIcon />
          Logout
        </button>
      )}
    </div>
  );
}
