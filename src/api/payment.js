import axios from "./axios";

export const createPayment = async (payload) => {
  const res = await axios.post("/payments", payload);
  return res.data;
};

export const payPayment = async (id) => {
  const res = await axios.post(`/payments/${id}/pay`);
  return res.data;
};

// Stripe Checkout Session oluşturur, ödeme sayfası URL'ini döner.
export const createCheckoutSession = async (id) => {
  const res = await axios.post(`/payments/${id}/checkout-session`);
  return res.data;
};

export const getMyPayments = async () => {
  const res = await axios.get("/payments/my");
  return res.data;
};

export const getAllPayments = async (filters = {}) => {
  const res = await axios.get("/payments", { params: filters });
  return res.data;
};