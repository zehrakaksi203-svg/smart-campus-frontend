import api from "./axios";

export const getMyGrades = () => {
  return api.get("/grades/my-grades");
};

export const getTranscript = () => {
  return api.get("/grades/transcript");
};

export const getAllGrades = () => {
  return api.get("/grades");
};
export const downloadTranscriptPdf = () => {
  return api.get("/grades/transcript/pdf", { responseType: "blob" });
};
export const createGrade = (data) => {
  return api.post("/grades", data);
};

export const updateGrade = (id, data) => {
  return api.put(`/grades/${id}`, data);
};