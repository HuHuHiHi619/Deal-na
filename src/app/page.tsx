"use client";

import { useEffect } from "react";
import LoginButton from "./component/Login";
import { useAuth } from "./store/auth/useAuth";
import { useRouter } from "next/navigation";
import MockLogin from "./component/MockLogin";
import { useRoom } from "./store/room/useRoomStore";

export default function Home() {
  const { clearRoom } = useRoom();
  {
    /* 
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!loading && user) {
        router.replace("/rooms"); // ถ้า login แล้ว → ไป /topic
      }
    }, [user, loading, router]);
    
    if (loading) return <p>Loading...</p>;
    */
  }
  return (
    <>
      <h1>DEAL-NA</h1>
      <p>PLEASE LOGIN TO CONTINUE</p>
      <button onClick={clearRoom} className="bg-red-600 text-white p-4">CLEAR ROOM</button>
      <MockLogin />
    </>
  );
}
