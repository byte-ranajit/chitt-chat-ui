import { useState } from "react";
import { login as loginApi } from "../services/authService";
import { decodeTokenPayload, getToken, getUser, logout as logoutUtils, saveUser } from "./AuthUtils";

import { AuthContext } from "./AuthContextValue";

const getInitialUser = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  return getUser();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);

  const login = async (userName, password) => {
    await loginApi(userName, password);

    const payload = decodeTokenPayload();

    if (!payload) {
      throw new Error("Login succeeded but no valid token payload was found.");
    }

    saveUser(payload);
    setUser(payload);
    return payload;
  };

  const logout = () => {
    logoutUtils();
    setUser(null);
  };

  const value = { user, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
