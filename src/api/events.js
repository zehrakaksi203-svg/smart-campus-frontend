import api from "./axios";

export const getAllEvents = () => {
  return api.get("/events");
};

export const getEventById = (id) => {
  return api.get(`/events/${id}`);
};

export const createEvent = (data) => {
  return api.post("/events", data);
};

export const registerForEvent = (eventId) => {
  return api.post("/events/registrations", { eventId });
};

export const getMyRegistrations = () => {
  return api.get("/events/my-registrations");
};

export const generateEventQr = (registrationId) => {
  return api.post(`/events/registrations/${registrationId}/qr`);
};

export const validateEventQr = (qrData) => {
  return api.post("/events/registrations/qr/validate", { qrData });
};