import api from "./axios";

export const getAllAttendances = () => {
  return api.get("/attendances");
};