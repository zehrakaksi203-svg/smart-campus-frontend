import api from "./axios";

export const getAllMeals = () => {
  return api.get("/meals");
};

export const createMeal = (data) => {
  return api.post("/meals", data);
};

export const createMealReservation = (mealId) => {
  return api.post("/meals/reservations", { mealId });
};

export const getMyMealReservations = () => {
  return api.get("/meals/reservations/my");
};

export const generateMealQr = (reservationId) => {
  return api.post(`/meals/reservations/${reservationId}/qr`);
};

export const validateMealQr = (qrData) => {
  return api.post("/meals/reservations/qr/validate", { qrData });
};