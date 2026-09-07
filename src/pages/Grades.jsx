import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  getMyGrades,
  getTranscript,
  getAllGrades,
  downloadTranscriptPdf,
} from "../api/grades";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const LETTER_STYLES = {
  AA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BB: "bg-lime-50 text-lime-700 border-lime-200",
  CB: "bg-amber-50 text-amber-700 border-amber-200",
  CC: "bg-amber-50 text-amber-700 border-amber-200",
  DC: "bg-orange-50 text-orange-700 border-orange-200",
  DD: "bg-orange-50 text-orange-700 border-orange-200",
  FD: "bg-red-50 text-red-700 border-red-200",
  FF: "bg-red-50 text-red-700 border-red-200",
};

const COLORS = [
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#ec4899",
];

function Grades() {
  const [role, setRole] = useState(null);
  const [myGrades, setMyGrades] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [allGrades, setAllGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const meRes = await api.get("/users/me");
        const userRole = meRes.data.role;
        setRole(userRole);

        if (userRole === "Student") {
          const [gradesRes, transcriptRes] = await Promise.all([
            getMyGrades(),
            getTranscript(),
          ]);
          setMyGrades(gradesRes.data || []);
          setTranscript(transcriptRes.data || null);
        } else {
          const res = await getAllGrades();
          setAllGrades(res.data || []);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Notlar yüklenirken bir hata oluştu."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const courseOptions = [];
  const seenCourseIds = new Set();
  allGrades.forEach((grade) => {
    const course = grade.enrollment?.course;
    const courseId = grade.enrollment?.courseId || course?.id;
    if (course && courseId && !seenCourseIds.has(courseId)) {
      seenCourseIds.add(courseId);
      courseOptions.push({ id: courseId, name: course.courseName, code: course.courseCode });
    }
  });

  const filteredGrades = selectedCourseId
    ? allGrades.filter(
        (grade) =>
          String(grade.enrollment?.courseId || grade.enrollment?.course?.id) ===
          String(selectedCourseId)
      )
    : [];

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await downloadTranscriptPdf();
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transkript.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Transkript indirilemedi.");
    } finally {
      setDownloading(false);
    }
  };

  const gpaData =
    transcript?.semesters?.map((sem) => ({
      name: `${sem.academicYear} ${sem.semester}`,
      gpa: Number(sem.gpa),
    })) || [];

  const totalCredits =
    transcript?.semesters?.reduce((sum, sem) => {
      return sum + (sem.totalCredits || 0);
    }, 0) || 0;

  const completedCourses =
    transcript?.semesters?.reduce((sum, sem) => {
      return sum + (sem.courses?.length || 0);
    }, 0) || 0;

  const gradeCounts = {};
  transcript?.semesters?.forEach((sem) => {
    sem.courses?.forEach((course) => {
      const grade = course.letterGrade || "Diğer";
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });
  });

  const pieData = Object.entries(gradeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const passedCount =
    transcript?.semesters?.reduce((sum, sem) => {
      return (
        sum +
        (sem.courses?.filter(
          (c) => c.status === "Passed" || c.status === "Başarılı"
        ).length || 0)
      );
    }, 0) || 0;

  const failedCount =
    transcript?.semesters?.reduce((sum, sem) => {
      return (
        sum +
        (sem.courses?.filter(
          (c) => c.status === "Failed" || c.status === "Başarısız"
        ).length || 0)
      );
    }, 0) || 0;

  const successData =
    passedCount > 0 || failedCount > 0
      ? [
          { name: "Başarılı", value: passedCount },
          { name: "Başarısız", value: failedCount },
        ]
      : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-1 text-slate-900">Notlar</h1>
      <p className="text-slate-500 text-sm mb-6">
        {role === "Student"
          ? "Ders notların, transkript özetin ve başarı grafiklerin."
          : "Öğrenci notlarını dersine göre görüntüle."}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {role === "Student" && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase">
                Genel Ortalama (CGPA)
              </p>
              <p className="text-3xl font-bold text-violet-600 mt-1">
                {transcript?.cgpa ?? "—"}
              </p>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="mt-4 w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              >
                {downloading ? "İndiriliyor..." : "📄 Transkript PDF İndir"}
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase">
                Toplam Kredi
              </p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {totalCredits}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase">
                Tamamlanan Ders
              </p>
              <p className="text-3xl font-bold text-slate-700 mt-1">
                {completedCourses}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-800 mb-4">Harf Notu Dağılımı</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-12">
                  Henüz harf notu bulunmuyor.
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-800 mb-4">Başarı Durumu</h2>
              {successData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={successData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-12">
                  Henüz başarı durumu verisi bulunmuyor.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-4">GPA Trendi</h2>
            {gpaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gpaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 4]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ fill: "#7c3aed", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">
                Dönemlik GPA verisi bulunmuyor.
              </p>
            )}
          </div>

          <h2 className="text-lg font-bold mb-4 text-slate-900">Ders Notlarım</h2>
          {myGrades.length === 0 ? (
            <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-dashed border-slate-300">
              Henüz not girilmemiş.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myGrades.map((item) => {
                const midterm = item.grade?.midterm ?? item.midterm;
                const finalGrade = item.grade?.final ?? item.final;
                const makeup = item.grade?.makeup ?? item.makeup;
                const average = item.grade?.average ?? item.average;
                const letterGrade = item.grade?.letterGrade ?? item.letterGrade;
                const status = item.grade?.status ?? item.status;
                const hasGradeInfo =
                  midterm != null || finalGrade != null || average != null;

                return (
                  <div
                    key={item.enrollmentId || item.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {item.course?.courseName || "Ders"}
                        </h3>
                        <p className="text-sm text-violet-600 font-semibold mt-0.5">
                          {item.course?.courseCode}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.semester} — {item.academicYear}
                        </p>
                      </div>
                      {letterGrade && (
                        <span
                          className={`text-sm font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                            LETTER_STYLES[letterGrade] ||
                            "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {letterGrade}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">
                      {hasGradeInfo ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          <p>Vize: {midterm ?? "—"}</p>
                          <p>Final: {finalGrade ?? "—"}</p>
                          {makeup != null && <p>Bütünleme: {makeup}</p>}
                          <p>Ortalama: {average ?? "—"}</p>
                          <p className="col-span-2">Durum: {status ?? "—"}</p>
                        </div>
                      ) : (
                        <p className="text-slate-400">Henüz not girilmedi.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {role !== "Student" && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ders Seçin
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full md:w-96 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">-- Bir ders seçin --</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {!selectedCourseId && (
            <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-dashed border-slate-300">
              Notları görüntülemek için lütfen bir ders seçin.
            </div>
          )}

          {selectedCourseId && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase">Öğrenci</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase">Ders</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase">Vize</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase">Final</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase">Ortalama</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase">Harf Notu</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((grade) => (
                    <tr
                      key={grade.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-700">
                        {grade.enrollment?.student?.user?.fullName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {grade.enrollment?.course?.courseName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{grade.midterm ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{grade.final ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{grade.average ?? "—"}</td>
                      <td className="px-4 py-3">
                        {grade.letterGrade ? (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                              LETTER_STYLES[grade.letterGrade] ||
                              "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {grade.letterGrade}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{grade.status ?? "—"}</td>
                    </tr>
                  ))}
                  {filteredGrades.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-slate-400"
                      >
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Grades;
