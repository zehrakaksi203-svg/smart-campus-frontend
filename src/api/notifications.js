import api from "./axios";

export const getMyNotifications = () => {
  return api.get("/notifications");
};

export const getUnreadCount = () => {
  return api.get("/notifications/unread-count");
};

export const markNotificationAsRead = (id) => {
  return api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
  return api.put("/notifications/read-all");
};

export const sendBulkNotification = (data) => {
  return api.post("/notifications/bulk", data);
};

