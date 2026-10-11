import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/axios";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setUser((await api.get("/auth/me")).data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const login = async (body) => { const { data } = await api.post("/auth/login", body); setUser(data); return data; };
  const register = async (body) => { const { data } = await api.post("/auth/register", body); setUser(data); return data; };
  const logout = async () => { await api.post("/auth/logout"); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}