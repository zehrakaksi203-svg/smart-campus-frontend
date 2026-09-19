import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api/analytics";
import { CardGridSkeleton } from "../components/Skeleton";
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.stats);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Dashboard istatistikleri yüklenirken bir hata oluştu."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            🛠️ Yönetici Paneli
          </h1>
          <CardGridSkeleton count={8} />
        </div>
      </div>
    );
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

  const cards = [
    {
      label: "Toplam Kullanıcı",
      value: stats.totalUsers,
      icon: "👥",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Bugün Aktif Kullanıcı",
      value: stats.activeUsersToday,
      icon: "🟢",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Toplam Ders",
      value: stats.totalCourses,
      icon: "📚",
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Toplam Kayıt",
      value: stats.totalEnrollments,
      icon: "📝",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Katılım Oranı",
      value: `%${stats.attendanceRate}`,
      icon: "📍",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      label: "Bugünkü Yemek Rezervasyonu",
      value: stats.mealReservationsToday,
      icon: "🍽️",
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Yaklaşan Etkinlikler",
      value: stats.upcomingEvents,
      icon: "🎉",
      color: "bg-fuchsia-50 text-fuchsia-600",
    },
    {
      label: "Sistem Durumu",
      value: stats.systemHealth === "healthy" ? "Sağlıklı" : stats.systemHealth,
      icon: "✅",
      color: "bg-green-50 text-green-600",
    },
  ];

  const analyticsLinks = [
    { to: "/admin/analytics/academic", label: "Akademik Performans", icon: "🎓" },
    { to: "/admin/analytics/attendance", label: "Yoklama Analitiği", icon: "📍" },
    { to: "/admin/analytics/meal", label: "Yemek Analitiği", icon: "🍽️" },
    { to: "/admin/analytics/events", label: "Etkinlik Analitiği", icon: "🎉" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl p-5 md:p-8 xl:p-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-semibold text-indigo-600">Sistem özeti</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Yönetici Paneli</h1></div>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">● Sistem çevrimiçi</span>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-lg ${c.color}`}
              >
                {c.icon}
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase">
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800">
                {c.value}
              </p>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">
          Detaylı Raporlar
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {analyticsLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/70"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 bg-slate-50 text-slate-600">
                {link.icon}
              </div>
              <div className="flex items-center justify-between gap-2"><h4 className="font-bold text-slate-800">{link.label}</h4><span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500">→</span></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
