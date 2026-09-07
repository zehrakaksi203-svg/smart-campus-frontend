import api from "./axios";

export const getAllAnnouncements = () => {
  return api.get("/announcements");
};

export const createAnnouncement = (data) => {
  return api.post("/announcements", data);
};
export const deleteAnnouncement = (id) => {
  return api.delete(`/announcements/${id}`);
};