import api from "./axios";

export const getMyNotifications = (params = {}) => {
  return api.get("/notifications", { params });
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

// Bildirimi sil
export const deleteNotification = (id) => {
  return api.delete(`/notifications/${id}`);
};

// Bildirim tercihlerini getir
export const getNotificationPreferences = () => {
  return api.get("/notifications/preferences");
};

// Bildirim tercihlerini güncelle
export const updateNotificationPreferences = (data) => {
  return api.put("/notifications/preferences", data);
};