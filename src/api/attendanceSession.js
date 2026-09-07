import api from "./axios";

export const createSession = (data) => {
  return api.post("/attendance/sessions", data);
};

export const getMySessions = () => {
  return api.get("/attendance/sessions/my-sessions");
};

export const closeSession = (id) => {
  return api.put(`/attendance/sessions/${id}/close`);
};

export const refreshQrCode = (id) => {
  return api.put(`/attendance/sessions/${id}/refresh-qr`);
};

export const checkIn = (id, data) => {
  return api.post(`/attendance/sessions/${id}/checkin`, data);
};

export const checkInWithQr = (qrCode, data) => {
  return api.post(`/attendance/sessions/checkin-qr/${qrCode}`, data);
};

export const getMyAttendance = () => {
  return api.get("/attendance/my-attendance");
};

export const getReport = (sectionId) => {
  return api.get(`/attendance/report/${sectionId}`);
};