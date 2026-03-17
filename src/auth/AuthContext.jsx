import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi } from "../services/authService";
import { getToken, getUser, logout as logoutUtis, saveUser } from "./AuthUtils";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const login = async (userName, password) => {
    try {
      await loginApi(userName, password);
      const token = getToken();

      if (!token) {
        throw new Error(
          "Login succeeded but no token is available in storage.",
        );
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      saveUser(payload);
      setUser(payload);
      return payload;
    } catch (error) {
      throw error;
    }
  };

  // 🚪 Logout
  const logout = () => {
    logoutUtis();
    setUser(null);
  };

  const value = { user, login, logout, isAuthenticated: !!user };

  // Prevent app render until auth check done
  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
