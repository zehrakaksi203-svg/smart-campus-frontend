
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as XLSX from "xlsx";

import { getAllEnrollments } from "../api/enrollments";
import { createGrade, updateGrade, getAllGrades } from "../api/grades";
import { sendBulkNotification } from "../api/notifications";

const calcLetterGrade = (avg) => {
  if (avg === null || avg === undefined || isNaN(avg)) return "";
  if (avg >= 90) return "AA";
  if (avg >= 85) return "BA";
  if (avg >= 80) return "BB";
  if (avg >= 75) return "CB";
  if (avg >= 70) return "CC";
  if (avg >= 60) return "DC";
  if (avg >= 50) return "DD";
  return "FF";
};

function Gradebook() {
  const { sectionId } = useParams();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [sendingNotification, setSendingNotification] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [enrollRes, gradesRes] = await Promise.all([
        getAllEnrollments(),
        getAllGrades(),
      ]);

      const sectionEnrollments = enrollRes.data.filter(
        (e) => Number(e.sectionId) === Number(sectionId)
      );

      const merged = sectionEnrollments.map((enr) => {
        const existingGrade = gradesRes.data.find(
          (g) => g.enrollmentId === enr.id
        );

        return {
          enrollmentId: enr.id,

          // Toplu bildirim için gerekli
          studentId: enr.studentId,

          studentName:
            enr.student?.user?.fullName || `Öğrenci #${enr.studentId}`,

          studentNumber:
            enr.student?.studentNumber || "—",

          gradeId: existingGrade?.id || null,

          midterm: existingGrade?.midterm ?? "",
          final: existingGrade?.final ?? "",
          makeup: existingGrade?.makeup ?? "",
        };
      });

      setRows(merged);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Öğrenci listesi yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const handleFieldChange = (enrollmentId, field, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.enrollmentId === enrollmentId
          ? { ...r, [field]: value }
          : r
      )
    );
  };

  const computeAverage = (row) => {
    const mid = parseFloat(row.midterm);
    const fin = parseFloat(row.final);
    const makeup = parseFloat(row.makeup);
  
    if (isNaN(mid)) return null;
  
    // Bütünleme girilmişse final yerine bütünleme kullanılır
    const secondExam = !isNaN(makeup) ? makeup : fin;
  
    if (isNaN(secondExam)) return null;
  
    return Math.round((mid * 0.4 + secondExam * 0.6) * 100) / 100;
  };

  const handleSaveRow = async (row) => {
    setSavingId(row.enrollmentId);
    setError("");
    setMessage("");

    try {
      const average = computeAverage(row);
      const letterGrade = calcLetterGrade(average);
      const status =
        average !== null && average >= 50
          ? "Passed"
          : "Failed";

      const payload = {
        enrollmentId: row.enrollmentId,
        midterm:
          row.midterm === "" ? null : Number(row.midterm),
        final:
          row.final === "" ? null : Number(row.final),
        makeup:
          row.makeup === "" ? null : Number(row.makeup),
        average,
        letterGrade,
        status,
      };

      if (row.gradeId) {
        await updateGrade(row.gradeId, payload);
      } else {
        await createGrade(payload);
      }

      setMessage(`${row.studentName} için not kaydedildi.`);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Not kaydedilemedi."
      );
    } finally {
      setSavingId(null);
    }
  };

  // --------------------------------------------------
  // EXCEL'E AKTAR
  // --------------------------------------------------

  const handleExportExcel = () => {
    if (rows.length === 0) {
      setError("Excel'e aktarılacak öğrenci bulunamadı.");
      return;
    }

    const excelData = rows.map((row) => {
      const average = computeAverage(row);

      return {
        "Öğrenci No": row.studentNumber,
        "Ad Soyad": row.studentName,
        Vize: row.midterm === "" ? "" : Number(row.midterm),
        Final: row.final === "" ? "" : Number(row.final),
        Bütünleme:
          row.makeup === "" ? "" : Number(row.makeup),
        Ortalama: average ?? "",
        "Harf Notu": calcLetterGrade(average),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Notlar"
    );

    XLSX.writeFile(
      workbook,
      `notlar-section-${sectionId}.xlsx`
    );

    setMessage("Notlar Excel dosyasına aktarıldı.");
  };

  // --------------------------------------------------
  // TOPLU BİLDİRİM
  // --------------------------------------------------

  const handleBulkNotification = async () => {
    if (rows.length === 0) {
      setError("Bildirim gönderilecek öğrenci bulunamadı.");
      return;
    }

    const title = window.prompt(
      "Bildirim başlığını girin:"
    );

    if (!title || !title.trim()) {
      return;
    }

    const message = window.prompt(
      "Bildirim mesajını girin:"
    );

    if (!message || !message.trim()) {
      return;
    }

    const studentIds = [
      ...new Set(
        rows
          .map((row) => Number(row.studentId))
          .filter((id) => !isNaN(id))
      ),
    ];

    if (studentIds.length === 0) {
      setError(
        "Öğrenci ID'leri bulunamadığı için bildirim gönderilemedi."
      );
      return;
    }

    setSendingNotification(true);
    setError("");
    setMessage("");

    try {
      const response = await sendBulkNotification({
        studentIds,
        title: title.trim(),
        message: message.trim(),
        type: "General",
      });

      setMessage(
        response.data?.message ||
          "Bildirimler başarıyla gönderildi."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Toplu bildirim gönderilemedi."
      );
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-600">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* BAŞLIK */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            📊 Not Girişi
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Section #{sectionId}
          </p>
        </div>

        <Link
          to="/courses"
          className="inline-block text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Derslere dön
        </Link>
      </div>

      {/* MESAJLAR */}

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 text-green-700 text-sm p-3 rounded-lg mb-4">
          {message}
        </div>
      )}

      {/* BUTONLAR */}

      <div className="bg-white rounded-xl shadow p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportExcel}
            disabled={rows.length === 0}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 Excel'e Aktar
          </button>

          <button
            onClick={handleBulkNotification}
            disabled={
              rows.length === 0 || sendingNotification
            }
            className="bg-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingNotification
              ? "📨 Gönderiliyor..."
              : "🔔 Toplu Bildirim Gönder"}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          {rows.length} öğrenci listeleniyor.
        </p>
      </div>

      {/* NOT TABLOSU */}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">
                Öğrenci No
              </th>

              <th className="text-left px-4 py-3">
                Ad Soyad
              </th>

              <th className="text-left px-4 py-3">
                Vize
              </th>

              <th className="text-left px-4 py-3">
                Final
              </th>

              <th className="text-left px-4 py-3">
                Bütünleme
              </th>

              <th className="text-left px-4 py-3">
                Ortalama
              </th>

              <th className="text-left px-4 py-3">
                Harf Notu
              </th>

              <th className="text-left px-4 py-3">
                İşlem
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const avg = computeAverage(row);

              return (
                <tr
                  key={row.enrollmentId}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3">
                    {row.studentNumber}
                  </td>

                  <td className="px-4 py-3">
                    {row.studentName}
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.midterm}
                      onChange={(e) =>
                        handleFieldChange(
                          row.enrollmentId,
                          "midterm",
                          e.target.value
                        )
                      }
                      className="w-20 border border-gray-300 rounded px-2 py-1"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.final}
                      onChange={(e) =>
                        handleFieldChange(
                          row.enrollmentId,
                          "final",
                          e.target.value
                        )
                      }
                      className="w-20 border border-gray-300 rounded px-2 py-1"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.makeup}
                      onChange={(e) =>
                        handleFieldChange(
                          row.enrollmentId,
                          "makeup",
                          e.target.value
                        )
                      }
                      className="w-20 border border-gray-300 rounded px-2 py-1"
                    />
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {avg ?? "—"}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {calcLetterGrade(avg)}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        handleSaveRow(row)
                      }
                      disabled={
                        savingId === row.enrollmentId
                      }
                      className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingId === row.enrollmentId
                        ? "Kaydediliyor..."
                        : "Kaydet"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  Bu section'a kayıtlı öğrenci bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Gradebook;
