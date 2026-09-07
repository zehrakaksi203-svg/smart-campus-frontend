import axios from "./axios";

export const generateSchedule = async (semester) => {
  const res = await axios.post("/scheduling/generate", { semester });
  return res.data;
};

export const getSchedule = async (semester) => {
  const res = await axios.get("/scheduling", {
    params: semester ? { semester } : {},
  });
  return res.data;
};