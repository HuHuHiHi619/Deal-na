"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMockAuth } from "../store/auth/useMockAuth";
import { useRoomForm } from "../store/useRoomForm";

export default function TopicPage() {
  const router = useRouter();
  const [rawTitle, setRawTitle] = useState<string>("");

  const { mockUser } = useMockAuth();
  const { setTitle } = useRoomForm();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("title is :", rawTitle);
    setTitle(rawTitle);
  };

  useEffect(() => {
    if (!mockUser) {
      router.push("/");
    }
    console.log("mockUSER", mockUser);
  }, [mockUser]);

  if (!mockUser) return null;
  return (
    <div className="flex items-center justify-center p-4">
      {/* container  */}
      <div className="w-full max-w-md bg-rose-100 rounded-2xl p-4 md:p-12 space-y-4 shadow-lg">
        <h2 className="text-2xl font-bold text-rose-700 mb-2">
          Create Today's Topic
        </h2>
        <p className="text-sm text-gray-600">
          Started by{" "}
          <span className="font-medium text-rose-600">{mockUser.username}</span>
        </p>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={rawTitle}
            placeholder="Enter your topic title..."
            name="title"
            onChange={(e) => setRawTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white/80 border border-rose-200 rounded-xl placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all duration-300"
            />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-rose-400 to-pink-400 text-white py-3 rounded-xl font-medium transform hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
          >
          CONFIRM TOPIC
        </button>
      </form>
          </div>
    </div>
  );
}
