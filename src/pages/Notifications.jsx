import { useEffect, useState } from "react";
import { confirmAction } from "../components/ConfirmDialog";
import { toastSuccess, toastError } from "../components/ToastContainer";
import { ListSkeleton } from "../components/Skeleton";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notifications";

const TYPE_LABELS = {
  General: "Genel",
  grade: "Not",
  event: "Etkinlik",
  meal: "Yemek",
  attendance: "Yoklama",
  payment: "Ödeme",
  system: "Sistem",
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 10;

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit };
      if (typeFilter) params.type = typeFilter;
      if (readFilter) params.isRead = readFilter;

      const res = await getMyNotifications(params);
      setNotifications(res.data.notifications || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Bildirimler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, readFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      setError("Bildirim okundu olarak işaretlenemedi.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      setError("Bildirimler okundu olarak işaretlenemedi.");
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmAction({
      title: "Bildirimi Sil",
      message: "Bu bildirimi silmek istediğinize emin misiniz?",
    });
    if (!ok) return;

    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toastSuccess("Bildirim silindi.");
    } catch (err) {
      toastError("Bildirim silinemedi.");
    }
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">🔔 Bildirimler</h1>
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            Tümünü okundu yap
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={typeFilter}
            onChange={handleFilterChange(setTypeFilter)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Tüm Kategoriler</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={readFilter}
            onChange={handleFilterChange(setReadFilter)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Hepsi</option>
            <option value="false">Okunmamış</option>
            <option value="true">Okunmuş</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

          {loading ? (
          <ListSkeleton count={5} />
        ) : notifications.length === 0 ? (
          <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-dashed border-slate-300">
            Bildirim bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-4 flex justify-between gap-4 ${
                  n.isRead
                    ? "bg-white border-slate-200"
                    : "bg-violet-50 border-violet-200"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                    )}
                  </div>
                  <p className="font-semibold text-slate-800">{n.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(n.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-800 whitespace-nowrap"
                    >
                      Okundu Yap
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 whitespace-nowrap"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-300 disabled:opacity-40"
            >
              Önceki
            </button>
            <span className="text-sm text-slate-500">
              Sayfa {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-300 disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;