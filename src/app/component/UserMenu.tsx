"use client";
import { useAuth } from "../store/auth/useAuth";
import LogoutButton from "./button/LogoutButton";

const UserMenu = () => {
  const { user } = useAuth();

  const name = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email ?? "";
  const initial = (name?.[0] || email[0] || "?").toUpperCase();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="type-heading flex h-12 w-12 items-center justify-center rounded-xl bg-coral text-white">
          {initial}
        </div>
        <div className="leading-tight">
          <p className="type-caption text-muted">signed in as</p>
          <p className="type-body font-semibold text-ink">{name || email}</p>
        </div>
      </div>

      <LogoutButton mini />
    </div>
  );
};

export default UserMenu;
