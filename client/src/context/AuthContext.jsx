import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/axios";

const Ctx = createContext(null);

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the currently logged-in user's information.
  // Clear the session only when the server returns a genuine 401.
  const refresh = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      // A 401 means the user is not authenticated.
      // Other errors (429, network failures, 500, etc.)
      // should not automatically log the user out.
      if (e.response?.status === 401) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check the user's session when the application starts.
  useEffect(() => {
    refresh();
  }, []);

  // Log in an existing user.
  const login = async (body) => {
    const { data } = await api.post("/auth/login", body);
    setUser(data);
    return data;
  };

  // Register a new user.
  const register = async (body) => {
    const { data } = await api.post("/auth/register", body);
    setUser(data);
    return data;
  };

  // Log out the current user.
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}