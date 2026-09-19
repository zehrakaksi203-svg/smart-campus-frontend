import { useEffect, useMemo, useState } from "react";
import axios from "../api/axios";
import {
  createPayment,
  payPayment,
  createCheckoutSession,
  getMyPayments,
  getAllPayments,
} from "../api/payment";

const TYPE_LABELS = {
  Tuition: "Harç",
  Meal: "Yemek",
  Event: "Etkinlik",
};

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-700 border-amber-300",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Failed: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_LABELS = {
  Pending: "Bekliyor",
  Completed: "Tamamlandı",
  Failed: "Başarısız",
};

export default function Payments() {
  const [role, setRole] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [checkoutId, setCheckoutId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    type: "Tuition",
    amount: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Stripe Checkout dönüşünde ?checkout=success/cancel göstermek için
  const [checkoutNotice, setCheckoutNotice] = useState(null);

  useEffect(() => {
    axios.get("/users/me").then((res) => setRole(res.data.role));

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    if (checkoutStatus === "success") {
      setCheckoutNotice("success");
    } else if (checkoutStatus === "cancel") {
      setCheckoutNotice("cancel");
    }
    if (checkoutStatus) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const isAdmin = role === "Admin" || role === "Faculty";
      const data = isAdmin ? await getAllPayments() : await getMyPayments();
      setPayments(data);
    } catch (err) {
      setError("Ödemeler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handlePay = async (id) => {
    setPayingId(id);
    setError("");
    try {
      await payPayment(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Ödeme sırasında bir hata oluştu.");
    } finally {
      setPayingId(null);
    }
  };

  const handleCheckout = async (id) => {
    setCheckoutId(id);
    setError("");
    try {
      const { url } = await createCheckoutSession(id);
      window.location.href = url;
    } catch (err) {
      setError(
        err?.response?.data?.message || "Ödeme sayfasına yönlendirilirken bir hata oluştu."
      );
      setCheckoutId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        description: form.description || undefined,
      };
      if (isAdmin && form.studentId) {
        payload.studentId = Number(form.studentId);
      }
      await createPayment(payload);
      setForm({ studentId: "", type: "Tuition", amount: "", description: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Ödeme oluşturulurken bir hata oluştu.");
    } finally {
      setCreating(false);
    }
  };

  const isAdmin = role === "Admin" || role === "Faculty";

  const summary = useMemo(() => {
    const completed = payments.filter((p) => p.status === "Completed");
    const pending = payments.filter((p) => p.status === "Pending");
    return {
      totalPaid: completed.reduce((sum, p) => sum + Number(p.amount), 0),
      totalPending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingCount: pending.length,
      totalCount: payments.length,
    };
  }, [payments]);

  const visiblePayments = useMemo(() => {
    let list = [...payments];

    if (typeFilter !== "all") {
      list = list.filter((p) => p.type === typeFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.description?.toLowerCase().includes(q) ||
          String(p.studentId).includes(q) ||
          TYPE_LABELS[p.type]?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sortOrder === "newest" ? -diff : diff;
    });

    return list;
  }, [payments, typeFilter, statusFilter, search, sortOrder]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ödemeler</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin
              ? "Tüm ödeme kayıtlarını görüntüleyin"
              : "Ödeme geçmişinizi görüntüleyin ve bekleyen ödemelerinizi tamamlayın"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
          >
            {showForm ? "Vazgeç" : "Yeni Ödeme"}
          </button>
        )}
      </div>

      {checkoutNotice === "success" && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm">
          Ödeme başarıyla alındı. Durumun bir anda güncellenmemesi halinde birkaç saniye içinde
          sayfayı yenileyebilirsin.
        </div>
      )}
      {checkoutNotice === "cancel" && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm">
          Ödeme iptal edildi, işlem tamamlanmadı.
        </div>
      )}

      {/* Özet kartları */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              {isAdmin ? "Toplam Gelir" : "Toplam Ödenen"}
            </p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              ₺{summary.totalPaid.toLocaleString("tr-TR")}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Bekleyen Tutar
            </p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              ₺{summary.totalPending.toLocaleString("tr-TR")}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Bekleyen İşlem
            </p>
            <p className="text-xl font-bold text-gray-700 mt-1">
              {summary.pendingCount}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Toplam İşlem
            </p>
            <p className="text-xl font-bold text-gray-700 mt-1">
              {summary.totalCount}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3"
        >
          {isAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Öğrenci ID
              </label>
              <input
                type="number"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Tür
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="Tuition">Harç</option>
              <option value="Meal">Yemek</option>
              <option value="Event">Etkinlik</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Tutar (₺)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Açıklama (opsiyonel)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
          >
            {creating ? "Oluşturuluyor..." : "Ödeme Kaydı Oluştur"}
          </button>
        </form>
      )}

      {/* Filtreler */}
      {!loading && payments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">Tüm Türler</option>
            <option value="Tuition">Harç</option>
            <option value="Meal">Yemek</option>
            <option value="Event">Etkinlik</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Pending">Bekliyor</option>
            <option value="Completed">Tamamlandı</option>
            <option value="Failed">Başarısız</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="newest">En Yeni</option>
            <option value="oldest">En Eski</option>
          </select>
          {isAdmin && (
            <input
              type="text"
              placeholder="Açıklama veya öğrenci ID ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">Yükleniyor...</div>
      ) : payments.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-dashed border-gray-300">
          Henüz bir ödeme kaydı yok.
        </div>
      ) : visiblePayments.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-dashed border-gray-300">
          Filtreye uyan ödeme bulunamadı.
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePayments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">
                    {TYPE_LABELS[p.type] || p.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status]}`}
                  >
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
                {p.description && (
                  <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                )}
                {isAdmin && (
                  <p className="text-xs text-gray-400 mt-1">
                    Öğrenci ID: {p.studentId}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(p.createdAt).toLocaleString("tr-TR")}
                  {p.paidAt &&
                    ` • Ödendi: ${new Date(p.paidAt).toLocaleString("tr-TR")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-800">
                  ₺{Number(p.amount).toLocaleString("tr-TR")}
                </span>
                {p.status === "Pending" && !isAdmin && (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleCheckout(p.id)}
                      disabled={checkoutId === p.id}
                      className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition whitespace-nowrap"
                    >
                      {checkoutId === p.id ? "Yönlendiriliyor..." : "💳 Kartla Öde"}
                    </button>
                    <button
                      onClick={() => handlePay(p.id)}
                      disabled={payingId === p.id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition whitespace-nowrap"
                    >
                      {payingId === p.id ? "İşleniyor..." : "Simüle Öde (test)"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
