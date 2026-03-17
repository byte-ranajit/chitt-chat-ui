export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
    const currentUser = localStorage.getItem("user");
    if (currentUser) {
        return JSON.parse(currentUser);
    }
    const token = getToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload;
    } catch (error) {
        console.error("Error parsing token:", error);
        return null;
    }
};

export const saveUser = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
}

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