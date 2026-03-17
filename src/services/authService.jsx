import axiosClient from "../api/axiosCLient";

export const login = async (username, password) => {
  const response = await axiosClient.post("/auth/login", {
    username,
    password
  });
  localStorage.setItem("token", response.data.token);
  return response.data;
};