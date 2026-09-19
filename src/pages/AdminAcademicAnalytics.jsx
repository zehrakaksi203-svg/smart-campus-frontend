import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAcademicPerformance, exportReport } from "../api/analytics";

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

function AdminAcademicAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAcademicPerformance();
        setData(res.data.performance);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Akademik performans verisi yüklenirken bir hata oluştu."
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
      const res = await exportReport("academic", format);
      const extension = format === "excel" ? "xlsx" : format;
      downloadBlob(res.data, `academic-report.${extension}`);
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
            🎓 Akademik Performans
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

        {/* Bölüme göre GPA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Bölüme Göre Ortalama GPA</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.gpaByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="departmentCode" />
              <YAxis domain={[0, 4]} />
              <Tooltip />
              <Bar dataKey="averageGpa" fill="#7c3aed" name="Ortalama GPA" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Not dağılımı */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Not Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="letterGrade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" name="Öğrenci Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pass/Fail oranları */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-semibold uppercase">
              Başarılı Oranı
            </p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              %{data.passFailRates.passRate}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {data.passFailRates.passCount} öğrenci
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-semibold uppercase">
              Başarısız Oranı
            </p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              %{data.passFailRates.failRate}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {data.passFailRates.failCount} öğrenci
            </p>
          </div>
        </div>

        {/* Top / At-risk öğrenciler */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">🏆 En Başarılı Öğrenciler</h3>
            <div className="space-y-2">
              {data.topStudents.map((s) => (
                <div
                  key={s.studentId}
                  className="flex justify-between items-center text-sm border-b border-slate-100 pb-2"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{s.fullName}</p>
                    <p className="text-xs text-slate-400">{s.department}</p>
                  </div>
                  <span className="font-bold text-emerald-600">{s.gpa}</span>
                </div>
              ))}
              {data.topStudents.length === 0 && (
                <p className="text-slate-400 text-sm">Veri yok.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4">⚠️ Riskli Öğrenciler</h3>
            <div className="space-y-2">
              {data.atRiskStudents.map((s) => (
                <div
                  key={s.studentId}
                  className="flex justify-between items-center text-sm border-b border-slate-100 pb-2"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{s.fullName}</p>
                    <p className="text-xs text-slate-400">{s.department}</p>
                  </div>
                  <span className="font-bold text-red-600">{s.gpa}</span>
                </div>
              ))}
              {data.atRiskStudents.length === 0 && (
                <p className="text-slate-400 text-sm">Riskli öğrenci yok.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAcademicAnalytics;