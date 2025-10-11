"use client";
import LoginButton from "./component/LoginButton";
import MockLogin from "./component/MockLogin";
import { HeartHandshake } from 'lucide-react';

export default function Home() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="flex items-center justify-center space-x-2 text-3xl md:text-4xl font-bold text-rose-600">
            <p>DEAL</p>
            <HeartHandshake size={34} />
            <p>NA</p>
          </h1>
          <p className=" md:text-lg text-rose-400">
            PREPARE YOURSELF FOR DECISION
          </p>
          <p className="text-sm md:text-base text-gray-600">
            CREATE TOPIC THEN VOTE
          </p>
        </div>

        {/* BUTTON */}
        <div className="space-y-3 text-center">
          <LoginButton />
          <MockLogin />
        </div>
      </div>
    </div>
  );
}
