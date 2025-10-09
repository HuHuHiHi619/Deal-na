
import { useRouter } from "next/navigation";
import { useMockAuth } from "../store/auth/useMockAuth";
import { useEffect } from "react";

export default function MockLogin() {
  const { login , mockUser } = useMockAuth();
  const router = useRouter();

  const handleLogin = (user: { id: string; username: string }) => {
    login(user);
    router.push("/room"); // หน้า vote ของคุณ
  };

  useEffect(() => {
    console.log('mock user', mockUser )
  },[])
  return (
    <div>
      <h1>Mock Login</h1>
      <button className="bg-violet-400 text-white p-4" onClick={() => handleLogin({ id: "3e23a325-c2c7-434d-9caf-03bf91fd1fe1", username: "alice" })}>
        Login as Alice
      </button>
      <button  className="bg-emerald-400 text-white p-4" onClick={() => handleLogin({ id: "dde17cbf-6671-45a1-aa55-72f77376faaf", username: "bob" })}>
        Login as Bob
      </button>
    </div>
  );
}
