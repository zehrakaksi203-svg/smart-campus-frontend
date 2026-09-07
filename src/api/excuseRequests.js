import api from "./axios";

export const createExcuseRequest = (data) => {
  return api.post("/attendance/excuse-requests", data);
};

export const getMyExcuseRequests = () => {
  return api.get("/attendance/excuse-requests/my-requests");
};

export const getAllExcuseRequests = () => {
  return api.get("/attendance/excuse-requests");
};

export const approveExcuseRequest = (id, notes) => {
  return api.put(`/attendance/excuse-requests/${id}/approve`, { notes });
};

export const rejectExcuseRequest = (id, notes) => {
  return api.put(`/attendance/excuse-requests/${id}/reject`, { notes });
};

export const deleteExcuseRequest = (id) => {
  return api.delete(`/attendance/excuse-requests/${id}`);
};