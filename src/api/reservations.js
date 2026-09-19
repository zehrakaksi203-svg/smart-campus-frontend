import api from "./axios";

export const createReservation = async (data) => {
  const res = await api.post("/reservations", data);
  return res.data;
};

export const getMyReservations = async () => {
  const res = await api.get("/reservations/my");
  return res.data;
};

export const getAllReservations = async () => {
  const res = await api.get("/reservations");
  return res.data;
};

export const approveReservation = async (id) => {
  const res = await api.put(`/reservations/${id}/approve`);
  return res.data;
};

export const rejectReservation = async (id) => {
  const res = await api.put(`/reservations/${id}/reject`);
  return res.data;
};

export const cancelReservation = async (id) => {
  const res = await api.delete(`/reservations/${id}`);
  return res.data;
};