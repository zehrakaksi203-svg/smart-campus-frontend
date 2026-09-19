import api from "./axios";

export const getDashboardStats = () => {
  return api.get("/analytics/dashboard");
};

export const getAcademicPerformance = () => {
  return api.get("/analytics/academic-performance");
};

export const getAttendanceAnalytics = () => {
  return api.get("/analytics/attendance");
};

export const getMealUsageAnalytics = () => {
  return api.get("/analytics/meal-usage");
};

export const getEventAnalytics = () => {
  return api.get("/analytics/events");
};

export const exportReport = (type, format = "excel") => {
  return api.get(`/analytics/export/${type}`, {
    params: { format },
    responseType: "blob",
  });
};