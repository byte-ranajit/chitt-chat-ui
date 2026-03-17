export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    return JSON.parse(storedUser);
  }

  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
};

export const saveUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const isLoggedIn = () => {
  return !!getToken();
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userName");
};

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 < Date.now();
};


export const getUserName = (user = getUser()) => {
  if (!user || typeof user !== "object") return null;

  return user.userName ?? user.userName ?? user.sub ?? user.preferred_username ?? null;
};
