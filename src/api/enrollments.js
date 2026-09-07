
import api from "./axios";

export const getMyEnrollments = () => {
  return api.get("/enrollments/my-courses");
};
export const createEnrollment = (sectionId) => {
  return api.post("/enrollments", {
    sectionId,
    semester: "Güz",
    academicYear: "2026-2027",
  });
};

export const getAllEnrollments = () => {
  return api.get("/enrollments");
};

export const deleteEnrollment = (id) => {
  return api.delete(`/enrollments/${id}`);
};

