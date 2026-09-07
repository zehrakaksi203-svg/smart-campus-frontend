import api from "./axios";

export const getAllCourseSections = () => {
  return api.get("/course-sections", {
    baseURL: "http://localhost:3001/api",
  });
};

export const getCourseById = (id) => {
  return api.get(`/courses/${id}`, {
    baseURL: "http://localhost:3001/api/v1",
  });
};

export const getPrerequisitesByCourse = (courseId) => {
  return api.get(`/course-prerequisites/course/${courseId}`, {
    baseURL: "http://localhost:3001/api/v1",
  });
};

// Tüm dersleri listele (Ders Yönetimi sayfası için)
export const getAllCourses = () => {
  return api.get("/courses", {
    baseURL: "http://localhost:3001/api/v1",
  });
};

// Yeni ders oluştur (Admin/Faculty)
export const createCourse = (courseData) => {
  return api.post("/courses", courseData, {
    baseURL: "http://localhost:3001/api/v1",
  });
};

// Ders sil (Admin/Faculty)
export const deleteCourse = (id) => {
  return api.delete(`/courses/${id}`, {
    baseURL: "http://localhost:3001/api/v1",
  });
};

// Ders şubesinin gün/saat/derslik bilgisini güncelle (Ders Programı sürükle-bırak için)
export const updateCourseSection = (id, data) => {
  return api.put(`/course-sections/${id}`, data, {
    baseURL: "http://localhost:3001/api",
  });
};