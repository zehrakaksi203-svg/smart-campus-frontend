import { useEffect, useState } from "react";
import { confirmAction } from "../components/ConfirmDialog";
import { toastSuccess, toastError } from "../components/ToastContainer";
import api from "../api/axios";
import {
  createReservation,
  getMyReservations,
  getAllReservations,
  approveReservation,
  rejectReservation,
  cancelReservation,
} from "../api/reservations";
import { getAllClassrooms } from "../api/classrooms";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-600",
  Approved: "bg-emerald-50 text-emerald-600",
  Rejected: "bg-red-50 text-red-600",
  Cancelled: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS = {
  Pending: "Onay Bekliyor",
  Approved: "Onaylandı",
  Rejected: "Reddedildi",
  Cancelled: "İptal Edildi",
};

function Reservations() {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    classroomId: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
  });

  const isAdmin = user?.role === "Admin";

  const loadData = async () => {
    try {
      const me = await api.get("/users/me");
      setUser(me.data);

      const classroomList = await getAllClassrooms();
      setClassrooms(classroomList);

      const mine = await getMyReservations();
      setMyReservations(mine);

      if (me.data.role === "Admin") {
        const all = await getAllReservations();
        setAllReservations(all);
      }
    } catch (err) {
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createReservation({
        classroomId: Number(form.classroomId),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
      });
      setSuccess("Rezervasyon talebiniz oluşturuldu, onay bekleniyor.");
      setForm({ classroomId: "", date: "", startTime: "", endTime: "", purpose: "" });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Rezervasyon oluşturulamadı.");
    }
  };
  const handleApprove = async (id) => {
    try {
      await approveReservation(id);
      toastSuccess("Rezervasyon onaylandı.");
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || "Onaylama başarısız.");
    }
  };

  const handleReject = async (id) => {
    const ok = await confirmAction({
      title: "Rezervasyonu Reddet",
      message: "Bu rezervasyon talebini reddetmek istediğinize emin misiniz?",
    });
    if (!ok) return;

    try {
      await rejectReservation(id);
      toastSuccess("Rezervasyon reddedildi.");
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || "Reddetme başarısız.");
    }
  };

  const handleCancel = async (id) => {
    const ok = await confirmAction({
      title: "Rezervasyonu İptal Et",
      message: "Bu rezervasyonu iptal etmek istediğinize emin misiniz?",
    });
    if (!ok) return;

    try {
      await cancelReservation(id);
      toastSuccess("Rezervasyon iptal edildi.");
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || "İptal başarısız.");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  const ReservationCard = ({ r, showUser, showActions }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-bold text-slate-800">
          {r.classroom?.building}-{r.classroom?.roomNumber}
        </p>
        <p className="text-sm text-slate-500 mt-0.5">
          {r.date} · {r.startTime} - {r.endTime}
        </p>
        {r.purpose && <p className="text-sm text-slate-500 mt-0.5">Amaç: {r.purpose}</p>}
        {showUser && (
          <p className="text-xs text-slate-400 mt-1">
            Talep eden: {r.user?.fullName} ({r.user?.email})
          </p>
        )}
        {r.approver && (
          <p className="text-xs text-slate-400 mt-1">
            {r.status === "Approved" ? "Onaylayan" : "Değerlendiren"}: {r.approver.fullName}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500"}`}
        >
          {STATUS_LABELS[r.status] || r.status}
        </span>
        {showActions && r.status === "Pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(r.id)}
              className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-full px-3 py-1 transition"
            >
              Onayla
            </button>
            <button
              onClick={() => handleReject(r.id)}
              className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full px-3 py-1 transition"
            >
              Reddet
            </button>
          </div>
        )}
        {!showActions && (r.status === "Pending" || r.status === "Approved") && (
          <button
            onClick={() => handleCancel(r.id)}
            className="text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1 transition"
          >
            İptal Et
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Derslik Rezervasyonları</h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-emerald-50 text-emerald-600 text-sm rounded-xl p-3 mb-4">{success}</div>
        )}

        {/* Yeni rezervasyon talebi formu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
          <h3 className="font-bold text-slate-800 mb-4">Yeni Rezervasyon Talebi</h3>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <select
              name="classroomId"
              value={form.classroomId}
              onChange={handleChange}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Derslik seçin</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.building}-{c.roomNumber} (Kapasite: {c.capacity})
                </option>
              ))}
            </select>

            <input
  type="date"
  name="date"
  value={form.date}
  onChange={handleChange}
  required
  min={new Date().toISOString().split("T")[0]}
  className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
/>

            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />

            <input
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />

            <input
              type="text"
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              placeholder="Amaç (örn. Kulüp toplantısı)"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm sm:col-span-2"
            />

            <button
              type="submit"
              className="sm:col-span-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg py-2.5 transition"
            >
              Talep Oluştur
            </button>
          </form>
        </div>

        {/* Benim taleplerim */}
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">
          Taleplerim
        </h3>
        <div className="space-y-3 mb-8">
          {myReservations.length === 0 && (
            <p className="text-slate-400 text-sm">Henüz bir rezervasyon talebiniz yok.</p>
          )}
          {myReservations.map((r) => (
            <ReservationCard key={r.id} r={r} showUser={false} showActions={false} />
          ))}
        </div>

        {/* Admin: tüm talepler */}
        {isAdmin && (
          <>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">
              Tüm Talepler (Admin)
            </h3>
            <div className="space-y-3">
              {allReservations.length === 0 && (
                <p className="text-slate-400 text-sm">Henüz hiç rezervasyon talebi yok.</p>
              )}
              {allReservations.map((r) => (
                <ReservationCard key={r.id} r={r} showUser={true} showActions={true} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Reservations;