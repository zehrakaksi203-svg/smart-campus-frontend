import api from "./axios";

export const getAllClassrooms = async () => {
  const res = await api.get("/classrooms");
  return res.data;
};