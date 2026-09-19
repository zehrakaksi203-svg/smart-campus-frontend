import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAttendanceAnalytics, exportReport } from "../api/analytics";

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function AdminAttendanceAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAttendanceAnalytics();
        setData(res.data.analytics);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Yoklama analitiği yüklenirken bir hata oluştu."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await exportReport("attendance", format);
      const extension = format === "excel" ? "xlsx" : format;
      downloadBlob(res.data, `attendance-report.${extension}`);
    } catch (err) {
      setError("Rapor dışa aktarılamadı.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            📍 Yoklama Analitiği
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport("excel")}
              disabled={exporting}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              PDF
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Derse göre katılım oranı */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Derse Göre Katılım Oranı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.attendanceRateByCourse}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="courseCode" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="attendanceRate" fill="#0891b2" name="Katılım %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Zaman içinde trend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Zaman İçinde Katılım Trendi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.attendanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="attendanceRate"
                stroke="#7c3aed"
                strokeWidth={2}
                name="Katılım %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Düşük katılımlı dersler */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">
              ⚠️ Düşük Katılımlı Dersler (%75 altı)
            </h3>
            <div className="space-y-2">
              {data.lowAttendanceCourses.map((c) => (
                <div
                  key={c.courseId}
                  className="flex justify-between items-center text-sm border-b border-slate-100 pb-2"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {c.courseCode} - {c.courseName}
                    </p>
                  </div>
                  <span className="font-bold text-red-600">
                    %{c.attendanceRate}
                  </span>
                </div>
              ))}
              {data.lowAttendanceCourses.length === 0 && (
                <p className="text-slate-400 text-sm">
                  Düşük katılımlı ders yok.
                </p>
              )}
            </div>
          </div>

          {/* Kritik devamsızlık gösteren öğrenciler */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">
              🚨 Kritik Devamsızlık (%70 altı)
            </h3>
            <div className="space-y-2">
              {data.criticalAbsenceStudents.map((s) => (
                <div
                  key={s.studentId}
                  className="flex justify-between items-center text-sm border-b border-slate-100 pb-2"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{s.fullName}</p>
                    <p className="text-xs text-slate-400">{s.studentNumber}</p>
                  </div>
                  <span className="font-bold text-red-600">
                    %{s.attendanceRate}
                  </span>
                </div>
              ))}
              {data.criticalAbsenceStudents.length === 0 && (
                <p className="text-slate-400 text-sm">
                  Kritik devamsızlık gösteren öğrenci yok.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAttendanceAnalytics;