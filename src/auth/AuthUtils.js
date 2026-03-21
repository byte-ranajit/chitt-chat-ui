const AUTH_STORAGE_KEYS = ["token", "user", "userName"];

function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const getToken = () => localStorage.getItem("token");

export const decodeTokenPayload = (token = getToken()) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const [, payloadSegment] = token.split(".");

    if (!payloadSegment) {
      return null;
    }

    return parseJson(atob(payloadSegment));
  } catch {
    return null;
  }
};

export const getUser = () => {
  const storedUser = parseJson(localStorage.getItem("user"));

  if (storedUser) {
    return storedUser;
  }

  return decodeTokenPayload();
};

export const saveUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const isLoggedIn = () => Boolean(getToken());

export const logout = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const isTokenExpired = () => {
  const payload = decodeTokenPayload();

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 < Date.now();
};

export const getUserName = (user = getUser()) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  return user.userName ?? user.username ?? user.sub ?? user.preferred_username ?? null;
};
