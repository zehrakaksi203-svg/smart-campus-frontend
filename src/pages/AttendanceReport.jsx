import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { getReport } from "../api/attendanceSession";

function AttendanceReport() {
  const { sectionId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReport(sectionId);
      setSessions(Array.isArray(res.data?.sessions) ? res.data.sessions : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Rapor yuklenirken bir hata olustu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const filteredSessions = sessions.filter((s) => {
    if (!s.date) return true;
    if (startDate && s.date < startDate) return false;
    if (endDate && s.date > endDate) return false;
    return true;
  });

  const totalSessions = filteredSessions.length;

  const studentMap = {};
  filteredSessions.forEach((session) => {
    (session.records || []).forEach((rec) => {
      const student = rec.student;
      if (!student) return;
      const key = student.id;
      if (!studentMap[key]) {
        studentMap[key] = {
          studentNumber: student.studentNumber,
          fullName: student.user?.fullName || student.fullName || "-",
          attended: 0,
          flagged: 0,
        };
      }
      studentMap[key].attended += 1;
      if (rec.isFlagged) studentMap[key].flagged += 1;
    });
  });

  const studentRows = Object.values(studentMap);
  const exportToExcel = () => {
    const rows = studentRows.map((s) => {
      const percentage =
        totalSessions > 0 ? Math.round((s.attended / totalSessions) * 100) : 0;
      return {
        "Öğrenci No": s.studentNumber || "-",
        "Ad Soyad": s.fullName,
        "Toplam Oturum": totalSessions,
        Katılım: s.attended,
        "Katılım Yüzde": percentage,
        "Şüpheli Kayıt": s.flagged,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Devamsızlık Raporu");
    XLSX.writeFile(workbook, `devamsizlik_raporu_section_${sectionId}.xlsx`);
  };
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yukleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Devamsizlik Raporu</h1>
      <p className="text-gray-500 mb-6">
        Section ID: {sectionId} - Toplam Oturum: {totalSessions}
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Baslangic Tarihi
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bitis Tarihi
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={exportToExcel}
          disabled={studentRows.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          Excele Aktar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Ogrenci No</th>
              <th className="text-left px-4 py-3">Ad Soyad</th>
              <th className="text-left px-4 py-3">Katilim</th>
              <th className="text-left px-4 py-3">Katilim Yuzde</th>
              <th className="text-left px-4 py-3">Supheli Kayit</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.map((s, idx) => {
              const percentage =
                totalSessions > 0
                  ? Math.round((s.attended / totalSessions) * 100)
                  : 0;
              return (
                <tr key={idx} className="border-b last:border-0">
                  <td className="px-4 py-3">{s.studentNumber || "-"}</td>
                  <td className="px-4 py-3">{s.fullName}</td>
                  <td className="px-4 py-3">
                    {s.attended}/{totalSessions}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        percentage < 70
                          ? "text-red-600 font-semibold"
                          : percentage < 80
                          ? "text-yellow-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {"%" + percentage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.flagged > 0 ? (
                      <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                        {s.flagged} supheli
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
            {studentRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Kayit bulunamadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link
        to="/attendance"
        className="inline-block mt-6 text-blue-600 font-medium hover:underline"
      >
        Devamsizlik ana sayfasina don
      </Link>
    </div>
  );
}

export default AttendanceReport;