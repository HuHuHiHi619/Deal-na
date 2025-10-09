"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMockAuth } from "../store/auth/useMockAuth";
import { useRoomForm } from "../store/useRoomForm";

export default function TopicPage() {
  const router = useRouter();
  const [rawTitle, setRawTitle] = useState<string>("");
 
  const { mockUser } = useMockAuth();
  const { setTitle } = useRoomForm()

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("title is :", rawTitle);
    setTitle(rawTitle);
  };

  useEffect(() => {
    if (!mockUser) {
      router.push("/");
    }
    console.log("mockUSER",mockUser);
  }, [mockUser]);

  if (!mockUser) return null;
  return (
    <>
      <form action="" onSubmit={handleFormSubmit}>
        <p>Today's Topic</p>
        <p>{ mockUser.username}</p>
        <input
          type="text"
          className="text-black border"
          value={rawTitle}
          placeholder="Title"
          name="title"
          onChange={(e) => (setRawTitle(e.target.value))}
        />

        <button className="text-black border-amber-500 border-2" type="submit">
          CONFIRM
        </button>
      </form>
    </>
  );
}
