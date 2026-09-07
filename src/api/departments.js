import api from "./axios";

export const getAllDepartments = () => {
  return api.get("/departments");
};