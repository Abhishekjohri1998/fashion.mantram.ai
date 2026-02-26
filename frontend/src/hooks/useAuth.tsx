import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  displayName?: string;
  avatarUrl?: string;
  token?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = (userInfo: User) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const signOut = async () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return { user, loading, login, signOut };
};
