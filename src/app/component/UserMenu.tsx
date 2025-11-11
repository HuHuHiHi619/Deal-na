'use client';
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../store/auth/useAuth";
import LogoutButton from "./button/LogoutButton";

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    console.log(user)
  },[])
  return (
    <div className="relative ">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-rose-100 cursor-pointer rounded-4xl hover:bg-rose-400 hover:scale-105 transition-all duration-300 "
      >
        <img 
          src={user?.user_metadata.avatar_url} 
          className="w-8 h-8 rounded-full " 
          alt="avatar"
        />
        <span className="text-sm font-medium ">
          {user?.user_metadata.full_name || user?.email}
        </span>
        <ChevronRight size={16} className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute -right-32 -top-3 mt-2 w-48 b overflow-hidden">
          <LogoutButton mini={true}/>
        </div>
      )}
    </div>
  );
};

export default UserMenu;