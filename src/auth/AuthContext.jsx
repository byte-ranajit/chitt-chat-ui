import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi } from "../services/authService";
import { getToken, getUser, logout as logoutUtis } from "./AuthUtils";

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

  const login = async (username, password) => {
    try {
      const data = await loginApi(username, password);
      const token = data.token;
      const payload = JSON.parse(atob(token.split(".")[1]));
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

  const value = { user, login, logout, isAuthenticated: !!user,};

  // Prevent app render until auth check done
  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
