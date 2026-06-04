"use client";
import { useState } from "react";
import { useRoomFormContext } from "../room/RoomFormContext";
import { useAuth } from "../store/auth/useAuth";
import { Ban } from "lucide-react";
import { useUiStore } from "../store/useUiStore";
import UserMenu from "../component/UserMenu";

export default function TopicPage() {
  const [rawTitle, setRawTitle] = useState<string>("");

  const { user } = useAuth();
  const { setTitle } = useRoomFormContext() ?? {};
  const { getError, setError } = useUiStore();
  const error = getError("rawTitle");

  // Confirm the topic (reveals the options below). `showErrors` is true on
  // explicit submit (Enter), false on blur so leaving an empty field is quiet.
  const confirmTitle = (showErrors: boolean) => {
    const title = rawTitle.trim();
    setError("rawTitle", null);

    if (!title) {
      if (showErrors) setError("rawTitle", "Please enter a topic title");
      return;
    }
    if (title.length < 3) {
      if (showErrors) setError("rawTitle", "Topic title must be at least 3 characters");
      return;
    }
    if (title.length > 200) {
      setError("rawTitle", "Topic title is too long (max 200 characters)");
      return;
    }
    setTitle?.(rawTitle);
  };

  if (!user) return null;
  return (
    <div className="flex flex-col gap-6">
      <UserMenu />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          confirmTitle(true);
        }}
      >
        <div className="bg-card rounded-3xl shadow-lg p-6">
          <p className="type-eyebrow text-muted mb-3">What are we deciding?</p>
          <input
            type="text"
            value={rawTitle}
            placeholder="Friday night dinner"
            name="title"
            onChange={(e) => {
              setRawTitle(e.target.value);
              if (error) setError("rawTitle", null);
            }}
            onBlur={() => {
              if (rawTitle.trim()) confirmTitle(false);
            }}
            className="type-heading w-full bg-transparent text-ink placeholder-muted/50 focus:outline-none"
          />
          <span className="mt-2 block h-[3px] w-[70%] rounded-full bg-sun" />
        </div>

        {error && (
          <div className="bg-coral-tint type-caption mt-3 flex items-center gap-2 rounded-xl px-4 py-2 text-coral">
            <Ban size={16} />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
