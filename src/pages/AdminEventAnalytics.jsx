import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getEventAnalytics, exportReport } from "../api/analytics";

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

function AdminEventAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getEventAnalytics();
        setData(res.data.analytics);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Etkinlik analitiği yüklenirken bir hata oluştu."
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
      const res = await exportReport("event", format);
      const extension = format === "excel" ? "xlsx" : format;
      downloadBlob(res.data, `event-report.${extension}`);
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

  const popularChartData = data.mostPopularEvents.map((e) => ({
    title: e.title.length > 15 ? `${e.title.slice(0, 15)}...` : e.title,
    totalRegistrations: e.totalRegistrations,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            🎉 Etkinlik Analitiği
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

        {/* En popüler etkinlikler */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">
            En Popüler Etkinlikler (Kayıt Sayısına Göre)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="totalRegistrations"
                fill="#c026d3"
                name="Toplam Kayıt"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tüm etkinlikler tablosu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
          <h3 className="font-bold text-slate-800 mb-4">Tüm Etkinlikler</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-200">
                <th className="pb-2 pr-4">Etkinlik</th>
                <th className="pb-2 pr-4">Kontenjan</th>
                <th className="pb-2 pr-4">Kayıtlı</th>
                <th className="pb-2 pr-4">Bekleme Listesi</th>
                <th className="pb-2 pr-4">Kayıt Oranı</th>
                <th className="pb-2">Check-in Oranı</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.eventId} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-semibold text-slate-800">
                    {e.title}
                  </td>
                  <td className="py-2 pr-4">{e.capacity}</td>
                  <td className="py-2 pr-4">{e.registeredCount}</td>
                  <td className="py-2 pr-4">{e.waitlistedCount}</td>
                  <td className="py-2 pr-4">%{e.registrationRate}</td>
                  <td className="py-2">%{e.checkInRate}</td>
                </tr>
              ))}
              {data.events.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    Etkinlik yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminEventAnalytics;