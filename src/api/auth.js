import api from "./axios";

export const login = (email, password) => {
  return api.post("/auth/login", { email, password });
};

export const register = (data) => {
  return api.post("/auth/register", data);
};

export const logout = (refreshToken) => {
  return api.post("/auth/logout", { refreshToken });
};

export const refreshAccessToken = (refreshToken) => {
  return api.post("/auth/refresh", { refreshToken });
};