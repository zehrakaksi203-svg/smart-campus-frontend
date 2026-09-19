import { useEffect, useState } from "react";
import api from "../api/axios";
import { getAllAnnouncements, createAnnouncement, deleteAnnouncement } from "../api/announcements";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendBulkNotification,
} from "../api/notifications";

import { getAllEnrollments } from "../api/enrollments";

function Announcements() {
  const [role, setRole] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);

  const loadData = async () => {
    try {
      setError("");

      const meRes = await api.get("/users/me");
      const currentRole = meRes.data.role;
      setRole(currentRole);

      const [announcementRes, notificationRes] = await Promise.all([
        getAllAnnouncements(),
        getMyNotifications(),
      ]);

      setAnnouncements(Array.isArray(announcementRes.data) ? announcementRes.data : []);
      setNotifications(
        Array.isArray(notificationRes.data?.notifications)
          ? notificationRes.data.notifications
          : Array.isArray(notificationRes.data)
            ? notificationRes.data
            : []
      );

      if (currentRole === "Admin" || currentRole === "Faculty") {
        try {
          const enrollmentsRes = await getAllEnrollments();
          const enrollments = enrollmentsRes.data || [];

          const uniqueStudents = [];
          const seen = new Set();

          enrollments.forEach((enrollment) => {
            const student = enrollment.student;

            if (!student) return;
            if (seen.has(student.id)) return;

            seen.add(student.id);

            uniqueStudents.push({
              id: student.id,
              name:
                student.user?.fullName ||
                student.fullName ||
                `Öğrenci #${student.id}`,
              studentNumber: student.studentNumber || "—",
            });
          });

          setStudents(uniqueStudents);
        } catch (enrollErr) {
          console.error("Öğrenci listesi yüklenemedi:", enrollErr);
        }
      }
    } catch (err) {
      console.error("Announcements load error:", err);

      setError(
        err.response?.data?.message ||
          "Duyurular ve bildirimler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await createAnnouncement({
        title,
        content,
        facultyId: facultyId ? Number(facultyId) : null,
        departmentId: departmentId ? Number(departmentId) : null,
        publishDate: new Date().toISOString().slice(0, 10),
        status: "Active",
      });

      setMessage("Duyuru yayınlandı.");

      setTitle("");
      setContent("");
      setFacultyId("");
      setDepartmentId("");
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Duyuru oluşturulamadı."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;

    setError("");
    setMessage("");

    try {
      await deleteAnnouncement(id);
      setMessage("Duyuru silindi.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Duyuru silinemedi.");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.isRead) {
      return;
    }

    try {
      await markNotificationAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, isRead: true }
            : n
        )
      );
    } catch (err) {
      console.error("Bildirim okunamadı:", err);
    }
  };

  const handleBulkNotification = async (e) => {
    e.preventDefault();

    if (selectedStudentIds.length === 0) {
      setError("En az bir öğrenci seçmelisiniz.");
      return;
    }

    if (!bulkTitle.trim() || !bulkMessage.trim()) {
      setError("Başlık ve mesaj alanları zorunludur.");
      return;
    }

    setBulkSending(true);
    setError("");
    setMessage("");

    try {
      const res = await sendBulkNotification({
        studentIds: selectedStudentIds,
        title: bulkTitle,
        message: bulkMessage,
        type: "General",
      });

      setMessage(
        res.data?.message || "Bildirimler başarıyla gönderildi."
      );

      setSelectedStudentIds([]);
      setBulkTitle("");
      setBulkMessage("");
      setShowBulkForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Toplu bildirim gönderilemedi."
      );
    } finally {
      setBulkSending(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(students.map((student) => student.id));
  };

  const clearSelectedStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );

      setMessage("Tüm bildirimler okundu olarak işaretlendi.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Bildirimler okundu olarak işaretlenemedi."
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* BAŞLIK */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Duyurular</h1>
            <p className="text-slate-500 text-sm mt-1">
              Sistem duyuruları ve kişisel bildirimlerin.
            </p>
          </div>
          <div className="flex gap-2">
            {(role === "Admin" || role === "Faculty") && (
              <>
                <button
                  onClick={() => setShowBulkForm(!showBulkForm)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  {showBulkForm ? "Vazgeç" : "Toplu Bildirim"}
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  {showForm ? "Vazgeç" : "Yeni Duyuru"}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-lg mb-4">
            {message}
          </div>
        )}

        {/* YENİ DUYURU FORMU */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Başlık
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                İçerik
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {submitting ? "Yayınlanıyor..." : "Yayınla"}
            </button>
          </form>
        )}

        {/* TOPLU BİLDİRİM FORMU */}
        {showBulkForm && (
          <form
            onSubmit={handleBulkNotification}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 space-y-4"
          >
            <h2 className="font-bold text-slate-800">📩 Toplu Bildirim Gönder</h2>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">
                Öğrenciler
              </label>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={selectAllStudents}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Tümünü Seç
                </button>
                <button
                  type="button"
                  onClick={clearSelectedStudents}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Seçimi Temizle
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="p-4 text-slate-400 text-sm">Öğrenci bulunamadı.</p>
                ) : (
                  students.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="accent-violet-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-400">
                          Öğrenci No: {student.studentNumber}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2">
                {selectedStudentIds.length} öğrenci seçildi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Bildirim Başlığı
              </label>
              <input
                type="text"
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
                placeholder="Örneğin: Sınav Duyurusu"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Mesaj
              </label>
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Öğrencilere gönderilecek mesaj..."
                required
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={bulkSending || selectedStudentIds.length === 0}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
            >
              {bulkSending
                ? "Gönderiliyor..."
                : `${selectedStudentIds.length} Öğrenciye Gönder`}
            </button>
          </form>
        )}

        {/* BİLDİRİMLER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              🔔 Bildirimler
              {unreadCount > 0 && (
                <span className="bg-violet-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllNotificationsAsRead}
                className="text-xs text-violet-600 hover:underline font-medium"
              >
                Tümünü okundu yap
              </button>
            )}
          </div>

          {notificationLoading ? (
            <p className="text-slate-400 text-sm">Bildirimler yükleniyor...</p>
          ) : notifications.length === 0 ? (
            <p className="text-slate-400 text-sm">Henüz bildiriminiz yok.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`border rounded-lg p-3.5 cursor-pointer transition ${
                    notification.isRead
                      ? "bg-white border-slate-200"
                      : "bg-violet-50 border-violet-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {notification.title}
                      </h3>
                      <p className="text-slate-600 text-sm mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {new Date(notification.createdAt).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        Yeni
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DUYURULAR */}
        <div>
          <h2 className="font-bold text-slate-800 mb-3">📢 Sistem Duyuruları</h2>

          {announcements.length === 0 ? (
            <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-dashed border-slate-300">
              Henüz duyuru yok.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">{a.title}</h3>
                      <p className="text-slate-600 text-sm mt-2">{a.content}</p>
                      <p className="text-xs text-slate-400 mt-3">
                        {new Date(a.publishDate).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    {(role === "Admin" || role === "Faculty") && (
                      <button
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold whitespace-nowrap shrink-0"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Announcements;
