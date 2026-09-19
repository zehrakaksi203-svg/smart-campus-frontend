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

export const getMySchedule = async () => {
  const res = await axios.get("/scheduling/my-schedule");
  return res.data;
};

export const exportMyScheduleIcal = async () => {
  const res = await axios.get("/scheduling/my-schedule/ical", {
    responseType: "blob",
  });
  return res.data;
};