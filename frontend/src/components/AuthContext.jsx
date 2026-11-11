import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, setUnauthorizedHandler } from "../api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Keeps the logged-in user available to every component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const login = useCallback(({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // If any request comes back "401 Unauthorized", log out automatically
  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  // When the app opens, check the saved token is still valid
  useEffect(() => {
    if (localStorage.getItem("token")) {
      getMe()
        .then((me) => {
          localStorage.setItem("user", JSON.stringify(me)); // picks up role changes
          setUser(me);
        })
        .catch(() => {});
    }
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
