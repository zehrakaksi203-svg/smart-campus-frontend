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
import { getMealUsageAnalytics, exportReport } from "../api/analytics";

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

function AdminMealAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMealUsageAnalytics();
        setData(res.data.analytics);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Yemek kullanım analitiği yüklenirken bir hata oluştu."
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
      const res = await exportReport("meal", format);
      const extension = format === "excel" ? "xlsx" : format;
      downloadBlob(res.data, `meal-report.${extension}`);
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

  const peakHoursFormatted = data.peakHours.map((h) => ({
    ...h,
    hourLabel: `${h.hour}:00`,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            🍽️ Yemek Kullanım Analitiği
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <p className="text-xs text-slate-400 font-semibold uppercase">
            Toplam Gelir
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {data.revenue} TL
          </p>
        </div>

        {/* Günlük kullanım */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Günlük Yemek Sayısı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyMealCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#f97316"
                strokeWidth={2}
                name="Rezervasyon Sayısı"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Yoğun saatler */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Yoğun Saatler</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHoursFormatted}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hourLabel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" name="Rezervasyon Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* En popüler yemekler */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">🏆 En Popüler Yemekler</h3>
          <div className="space-y-2">
            {data.mostPopularMeals.map((m) => (
              <div
                key={m.mealId}
                className="flex justify-between items-center text-sm border-b border-slate-100 pb-2"
              >
                <p className="font-semibold text-slate-800">{m.name}</p>
                <span className="font-bold text-orange-600">
                  {m.count} rezervasyon
                </span>
              </div>
            ))}
            {data.mostPopularMeals.length === 0 && (
              <p className="text-slate-400 text-sm">Veri yok.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMealAnalytics;