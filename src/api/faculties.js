import api from "./axios";

export const getAllFaculties = () => {
  return api.get("/faculties", {
    baseURL: "http://localhost:3001/api/v1",
  });
};

// Kullanıcı isimlerini eşlemek için (limit yüksek tutulup tek seferde tüm liste çekiliyor)
export const getAllUsers = () => {
  return api.get("/users?page=1&limit=200", {
    baseURL: "http://localhost:3001/api/v1",
  });
};