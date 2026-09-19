import api from "./axios";

export const getAllCourseSections = () => {
  return api.get("/course-sections", { baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });
};

export const getCourseById = (id) => {
  return api.get(`/courses/${id}`);
};

export const getPrerequisitesByCourse = (courseId) => {
  return api.get(`/course-prerequisites/course/${courseId}`);
};

// Tüm dersleri listele (Ders Yönetimi sayfası için)
export const getAllCourses = () => {
  return api.get("/courses");
};

// Yeni ders oluştur (Admin/Faculty)
export const createCourse = (courseData) => {
  return api.post("/courses", courseData);
};

// Ders sil (Admin/Faculty)
export const deleteCourse = (id) => {
  return api.delete(`/courses/${id}`);
};

// Yeni ders şubesi oluştur (Admin) — courseId, facultyId, sectionCode, semester,
// capacity, classroom, dayOfWeek, startTime, endTime zorunlu alanlar
export const createCourseSection = (sectionData) => {
  return api.post("/course-sections", sectionData, {
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  });
};

// Ders şubesinin gün/saat/derslik bilgisini güncelle (Ders Programı sürükle-bırak için)
export const updateCourseSection = (id, data) => {
  return api.put(`/course-sections/${id}`, data, { baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });
};