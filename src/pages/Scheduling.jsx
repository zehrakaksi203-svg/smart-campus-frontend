import { useEffect, useState } from "react";
import axios from "../api/axios";
import { generateSchedule, getSchedule } from "../api/scheduling";
import { updateCourseSection } from "../api/courses";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

const DAY_MAP = {
  Monday: "Pazartesi",
  Tuesday: "Salı",
  Wednesday: "Çarşamba",
  Thursday: "Perşembe",
  Friday: "Cuma",
  Pazartesi: "Pazartesi",
  Salı: "Salı",
  Çarşamba: "Çarşamba",
  Perşembe: "Perşembe",
  Cuma: "Cuma",
};

// Backend'in beklediği İngilizce gün adına çevirmek için (kayıt sırasında
// hangi dilde tutulduğu section'a göre değişebiliyor)
const DAY_TO_BACKEND = {
  Pazartesi: "Monday",
  Salı: "Tuesday",
  Çarşamba: "Wednesday",
  Perşembe: "Thursday",
  Cuma: "Friday",
};

const SEMESTER_MAP = {
  Güz: ["Güz", "Fall"],
  Bahar: ["Bahar", "Spring"],
  Yaz: ["Yaz", "Summer"],
};

function normalizeDay(day) {
  return DAY_MAP[day] || day;
}

const COLORS = [
  "bg-blue-100 border-blue-400 text-blue-800",
  "bg-emerald-100 border-emerald-400 text-emerald-800",
  "bg-amber-100 border-amber-400 text-amber-800",
  "bg-purple-100 border-purple-400 text-purple-800",
  "bg-rose-100 border-rose-400 text-rose-800",
  "bg-cyan-100 border-cyan-400 text-cyan-800",
];

function colorFor(key, map) {
  if (!map.has(key)) {
    map.set(key, COLORS[map.size % COLORS.length]);
  }
  return map.get(key);
}

// HH:MM formatındaki iki saat arasındaki dakika farkını bulup, yeni
// başlangıç saatine ekleyerek yeni bitiş saatini hesaplar (süre korunur)
function shiftEndTime(oldStart, oldEnd, newStart) {
  if (!oldStart || !oldEnd || !newStart) return oldEnd;

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const durationMin = toMinutes(oldEnd) - toMinutes(oldStart);
  const newStartMin = toMinutes(newStart);
  const newEndMin = newStartMin + durationMin;

  const hh = String(Math.floor(newEndMin / 60)).padStart(2, "0");
  const mm = String(newEndMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function Scheduling() {
  const [role, setRole] = useState(null);
  const [semester, setSemester] = useState("Güz");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const canEdit = role === "Admin" || role === "Faculty";

  const colorMap = new Map();

  useEffect(() => {
    axios.get("/users/me").then((res) => setRole(res.data.role));
  }, []);

  const loadSchedule = async (sem) => {
    setLoading(true);
    setError("");
    try {
      const data = await getSchedule();
      const all = Array.isArray(data) ? data : data.sections || [];
      const accepted = SEMESTER_MAP[sem] || [sem];
      setSections(all.filter((s) => accepted.includes(s.semester)));
    } catch (err) {
      setError("Program yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule(semester);
  }, [semester]);

  const handleGenerate = async () => {
    if (sections.length > 0) {
      const confirmed = window.confirm(
        "Bu dönem için zaten bir program var. Yeniden oluşturursanız mevcut program (yaptığınız manuel değişiklikler dahil) silinip otomatik olarak yeniden dağıtılacak. Devam etmek istiyor musunuz?"
      );
      if (!confirmed) return;
    }

    setGenerating(true);
    setMessage("");
    setError("");
    try {
      await generateSchedule(semester);
      setMessage("Ders programı başarıyla oluşturuldu.");
      await loadSchedule(semester);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Program oluşturulurken bir hata oluştu."
      );
    } finally {
      setGenerating(false);
    }
  };

  const slots = Array.from(
    new Set(sections.map((s) => s.startTime?.slice(0, 5)).filter(Boolean))
  ).sort();

  const cellFor = (day, slot) =>
    sections.filter(
      (s) => normalizeDay(s.dayOfWeek) === day && s.startTime?.slice(0, 5) === slot
    );

  const handleDragStart = (e, section) => {
    if (!canEdit) return;
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e, day, slot) => {
    if (!canEdit || !draggedSection) return;
    e.preventDefault();
    setDragOverCell(`${day}-${slot}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = async (e, day, slot) => {
    e.preventDefault();
    setDragOverCell(null);

    if (!canEdit || !draggedSection) return;

    const currentDay = normalizeDay(draggedSection.dayOfWeek);
    const currentSlot = draggedSection.startTime?.slice(0, 5);

    if (currentDay === day && currentSlot === slot) {
      setDraggedSection(null);
      return;
    }

    const targetItems = cellFor(day, slot);
    const conflict = targetItems.find(
      (s) =>
        s.id !== draggedSection.id &&
        (s.classroom === draggedSection.classroom ||
          s.facultyId === draggedSection.facultyId)
    );

    if (conflict) {
      setError(
        "Bu saatte aynı derslik veya öğretim üyesi için zaten bir ders var."
      );
      setDraggedSection(null);
      return;
    }

    const newEndTime = shiftEndTime(
      draggedSection.startTime?.slice(0, 5),
      draggedSection.endTime?.slice(0, 5),
      slot
    );

    const newDayOfWeek =
      draggedSection.dayOfWeek === DAY_TO_BACKEND[currentDay]
        ? DAY_TO_BACKEND[day]
        : day;

    setSavingId(draggedSection.id);
    setError("");
    setMessage("");

    const previousSections = sections;
    setSections((prev) =>
      prev.map((s) =>
        s.id === draggedSection.id
          ? { ...s, dayOfWeek: newDayOfWeek, startTime: slot, endTime: newEndTime }
          : s
      )
    );

    try {
      await updateCourseSection(draggedSection.id, {
        dayOfWeek: newDayOfWeek,
        startTime: slot,
        endTime: newEndTime,
      });
      setMessage("Ders programı güncellendi.");
    } catch (err) {
      setSections(previousSections);
      setError(
        err?.response?.data?.message ||
          "Değişiklik kaydedilemedi, önceki hâline geri alındı."
      );
    } finally {
      setSavingId(null);
      setDraggedSection(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ders Programı</h1>
          <p className="text-gray-500 text-sm mt-1">
            {canEdit
              ? "Dersleri sürükleyip başka bir gün/saate bırakarak programı düzenleyebilirsiniz."
              : "Haftalık ders programını görüntüleyin"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
          >
            <option value="Güz">Güz</option>
            <option value="Bahar">Bahar</option>
            <option value="Yaz">Yaz</option>
          </select>
          {role === "Admin" && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              {generating ? "Oluşturuluyor..." : "Programı Oluştur"}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">Yükleniyor...</div>
      ) : sections.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-dashed border-gray-300">
          Bu dönem için henüz bir program oluşturulmamış.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-24 p-3 text-left text-xs font-semibold text-gray-400 border-b border-gray-200">
                  Saat
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-left text-xs font-semibold text-gray-500 border-b border-gray-200"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot} className="border-b border-gray-100 last:border-0">
                  <td className="p-3 text-xs font-medium text-gray-400 align-top whitespace-nowrap">
                    {slot}
                  </td>
                  {DAYS.map((day) => {
                    const items = cellFor(day, slot);
                    const cellKey = `${day}-${slot}`;
                    const isDragOver = dragOverCell === cellKey;

                    return (
                      <td
                        key={day}
                        onDragOver={(e) => handleDragOver(e, day, slot)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day, slot)}
                        className={`p-2 align-top min-w-[160px] transition ${
                          isDragOver ? "bg-indigo-50 ring-2 ring-inset ring-indigo-300" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          {items.map((s) => {
                            const course = s.course || s.Course || {};
                            const classroom =
                              s.classroom || s.Classroom?.roomNumber || "-";
                            const key = course.courseCode || s.id;
                            const isSaving = savingId === s.id;

                            return (
                              <div
                                key={s.id}
                                draggable={canEdit}
                                onDragStart={(e) => handleDragStart(e, s)}
                                onDragEnd={handleDragEnd}
                                className={`rounded-lg border-l-4 px-3 py-2 text-xs shadow-sm ${colorFor(
                                  key,
                                  colorMap
                                )} ${canEdit ? "cursor-move" : ""} ${
                                  isSaving ? "opacity-50" : ""
                                }`}
                              >
                                <div className="font-semibold">
                                  {course.courseCode || "Ders"}
                                </div>
                                <div className="opacity-80 truncate">
                                  {course.courseName || ""}
                                </div>
                                <div className="opacity-70 mt-1">
                                  📍 {classroom}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
