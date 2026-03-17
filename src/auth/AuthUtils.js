export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
    return JSON.parse(localStorage.getItem("user"));
};

export const isLoggedIn = () => {
  return !!getToken();
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 < Date.now();
};