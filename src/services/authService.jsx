import axiosClient from "../api/authApi";

const getTokenFromResponse = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const directToken =
    payload.token ?? payload.accessToken ?? payload.jwt ?? payload.jwtToken;
  if (directToken) {
    return directToken;
  }

  const nestedData = payload.data;
  if (nestedData && typeof nestedData === "object") {
    return (
      nestedData.token ??
      nestedData.accessToken ??
      nestedData.jwt ??
      nestedData.jwtToken ??
      null
    );
  }

  return null;
};

export const login = async (username, password) => {
  const response = await axiosClient.post("/auth/login", {
    username,
    password,
  });

  const token = getTokenFromResponse(response.data);

  if (!token) {
    throw new Error("Login succeeded but no auth token was returned by the API.");
  }

  localStorage.setItem("token", token);
  return response.data;
};
