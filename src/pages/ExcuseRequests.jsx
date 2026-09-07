import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import {
  getAllExcuseRequests,
  approveExcuseRequest,
  rejectExcuseRequest,
  deleteExcuseRequest,
} from "../api/excuseRequests";

function ExcuseRequests() {
  const [role, setRole] = useState(null);
  const [excuses, setExcuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [notes, setNotes] = useState({});
  const [actingId, setActingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const meRes = await api.get("/users/me");
      setRole(meRes.data.role);

      const res = await getAllExcuseRequests();
      setExcuses(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Mazeret talepleri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNoteChange = (id, value) => {
    setNotes((prev) => ({ ...prev, [id]: value }));
  };

  const handleApprove = async (id) => {
    setActingId(id);
    setError("");
    setMessage("");
    try {
      await approveExcuseRequest(id, notes[id] || "");
      setMessage("Mazeret talebi onaylandı.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "İşlem başarısız.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    setActingId(id);
    setError("");
    setMessage("");
    try {
      await rejectExcuseRequest(id, notes[id] || "");
      setMessage("Mazeret talebi reddedildi.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "İşlem başarısız.");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu mazeret talebini kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");
    try {
      await deleteExcuseRequest(id);
      setMessage("Mazeret talebi silindi.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Silme işlemi başarısız.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  if (role !== "Faculty" && role !== "Admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">
          Bu sayfaya erişim yetkiniz yok.
        </p>
      </div>
    );
  }

  const pending = excuses.filter((e) => e.status === "Pending");
  const reviewed = excuses.filter((e) => e.status !== "Pending");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-slate-900">
          Mazeret Talepleri
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Öğrenci mazeret taleplerini görüntüleyin, onaylayın veya reddedin.
        </p>

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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-slate-900 mb-4">
            Bekleyen Talepler
            <span className="ml-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          </h2>

          {pending.length === 0 ? (
            <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              Bekleyen mazeret talebi yok.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((exc) => (
                <div
                  key={exc.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {exc.student?.user?.fullName || "Öğrenci"}
                        {exc.student?.studentNumber
                          ? ` (${exc.student.studentNumber})`
                          : ""}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {exc.session?.course?.courseName ||
                          exc.session?.section?.course?.courseName ||
                          `Oturum #${exc.sessionId}`}
                        {exc.session?.date ? ` — ${exc.session.date}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Beklemede
                      </span>
                      <button
                        onClick={() => handleDelete(exc.id)}
                        disabled={deletingId === exc.id}
                        title="Talebi sil"
                        className="text-slate-400 hover:text-red-600 text-xs font-medium disabled:opacity-50 transition"
                      >
                        {deletingId === exc.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mb-3">{exc.reason}</p>

                  {exc.documentUrl && (
                    <Link
                      to={exc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-violet-600 hover:underline mb-3"
                    >
                      📎 {exc.documentName || "Belgeyi görüntüle"}
                    </Link>
                  )}

                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Not (opsiyonel)"
                      value={notes[exc.id] || ""}
                      onChange={(e) => handleNoteChange(exc.id, e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(exc.id)}
                        disabled={actingId === exc.id}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() => handleReject(exc.id)}
                        disabled={actingId === exc.id}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">
            Değerlendirilmiş Talepler
            <span className="ml-2 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              {reviewed.length}
            </span>
          </h2>

          {reviewed.length === 0 ? (
            <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              Henüz değerlendirilmiş talep yok.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviewed.map((exc) => (
                <div key={exc.id} className="py-3 flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
                      {exc.student?.user?.fullName || "Öğrenci"}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{exc.reason}</p>
                    {exc.documentUrl && (
                      <Link
                        to={exc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs text-violet-600 hover:underline mt-1"
                      >
                        📎 {exc.documentName || "Belgeyi görüntüle"}
                      </Link>
                    )}
                    {exc.notes && (
                      <p className="text-xs text-slate-400 mt-1">Not: {exc.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={
                        exc.status === "Approved"
                          ? "text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                          : "text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"
                      }
                    >
                      {exc.status === "Approved" ? "Onaylandı" : "Reddedildi"}
                    </span>
                    <button
                      onClick={() => handleDelete(exc.id)}
                      disabled={deletingId === exc.id}
                      title="Talebi sil"
                      className="text-slate-400 hover:text-red-600 text-xs font-medium disabled:opacity-50 transition"
                    >
                      {deletingId === exc.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/attendance"
          className="inline-block mt-6 text-violet-600 font-medium hover:underline text-sm"
        >
          ← Devamsızlık ana sayfasına dön
        </Link>
      </div>
    </div>
  );
}

export default ExcuseRequests;
