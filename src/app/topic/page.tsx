"use client";
import { useState } from "react";
import { useRoomForm } from "../store/useRoomForm";
import { useAuth } from "../store/auth/useAuth";
import { Ban, PencilLine } from "lucide-react";
import { useUiStore } from "../store/useUiStore";
import LogoutButton from "../component/button/LogoutButton";
import UserMenu from "../component/UserMenu";

export default function TopicPage() {
  const [rawTitle, setRawTitle] = useState<string>("");
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const { user } = useAuth();
  const { setTitle } = useRoomForm();
  const { getError, setError } = useUiStore();
  const error = getError("rawTitle");

  const THROTTLE_MS = 2000;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("rawTitle", null);

    if (!rawTitle.trim()) {
      setError("rawTitle", "Please enter a topic title");
      return;
    }

    if (rawTitle.length < 3) {
      setError("rawTitle", "Topic title must be at least 3 characters");
      return;
    }

    if (rawTitle.length > 200) {
      setError("rawTitle", "Topic title is too long (max 200 characters)");
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < THROTTLE_MS) {
      setError("rawTitle", "Please wait before submitting another topic");
      return;
    }

    setLastSubmitTime(now);

    try {
      console.log("title is :", rawTitle);
      setTitle(rawTitle);
      setError("rawTitle", null);
    } catch (error) {
      setError("rawTitle", "Failed to create topic. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawTitle(e.target.value);
    // ลบ error เมื่อ user เริ่มแก้ไข
    if (error) {
      setError("rawTitle", null);
    }
  };

  if (!user) return null;
  return (
    <div className="flex items-center justify-center p-4">
      {/* container  */}
      <div className="w-full max-w-md bg-rose-200 rounded-2xl p-4 md:p-8 space-y-4 shadow-lg">
        <h2 className="flex items-center justify-center gap-3 text-2xl font-bold text-center text-rose-500 mb-4 border-b pb-4 border-rose-300">
          <PencilLine />
          Create Topic
        </h2>

        <div className="flex items-center gap-2 ">
          <UserMenu />
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={rawTitle}
              placeholder="Enter your topic title..."
              name="title"
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white shadow-lg  rounded-xl placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all duration-300"
            />
          </div>
          {error && (
            <div className=" flex gap-2 items-center justify-center bg-rose-300 text-red-500 mb-4 py-2 px-4 text-sm shadow-md font-medium rounded-xl ">
              <Ban />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-400 to-pink-400 text-white py-2 rounded-xl font-medium transform hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
          >
            CONFIRM TOPIC
          </button>
        </form>
      </div>
    </div>
  );
}
