import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../store/auth/useAuth";
import LogoutButton from "./button/LogoutButton";

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2  cursor-pointer"
      >
        <img 
          src={user?.user_metadata.avatar_url} 
          className="w-8 h-8 rounded-full" 
          alt="avatar"
        />
        <span className="text-sm font-medium hidden sm:block">
          {user?.user_metadata.full_name}
        </span>
        <ChevronRight size={16} className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute -right-36 -top-3 mt-2 w-48 b overflow-hidden">
          <LogoutButton mini={true}/>
        </div>
      )}
    </div>
  );
};

export default UserMenu;