import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  getAllMeals,
  createMeal,
  createMealReservation,
  getMyMealReservations,
  generateMealQr,
} from "../api/meals";

function Meals() {
  const [role, setRole] = useState(null);
  const [meals, setMeals] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quota, setQuota] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reservingId, setReservingId] = useState(null);
  const [qrLoadingId, setQrLoadingId] = useState(null);
  const [qrCodes, setQrCodes] = useState({});

  const loadData = async () => {
    try {
      setError("");

      const meRes = await api.get("/users/me");
      const currentRole = meRes.data.role;
      setRole(currentRole);

      const mealsRes = await getAllMeals();
      setMeals(mealsRes.data.meals || []);

      if (currentRole === "Student") {
        const resRes = await getMyMealReservations();
        setReservations(resRes.data.reservations || []);
      }
    } catch (err) {
      console.error("Meals load error:", err);

      setError(
        err.response?.data?.message ||
          "Yemekler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
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
      await createMeal({
        name,
        description,
        price: Number(price),
        quota: Number(quota),
        availableDate,
      });

      setMessage("Yemek oluşturuldu.");

      setName("");
      setDescription("");
      setPrice("");
      setQuota("");
      setAvailableDate("");
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Yemek oluşturulamadı."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserve = async (mealId) => {
    setReservingId(mealId);
    setError("");
    setMessage("");

    try {
      await createMealReservation(mealId);
      setMessage("Yemek rezervasyonu oluşturuldu.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Rezervasyon oluşturulamadı."
      );
    } finally {
      setReservingId(null);
    }
  };

  const handleGenerateQr = async (reservationId) => {
    setQrLoadingId(reservationId);
    setError("");

    try {
      const res = await generateMealQr(reservationId);

      setQrCodes((prev) => ({
        ...prev,
        [reservationId]: res.data.data.qrCode,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "QR kod oluşturulamadı."
      );
    } finally {
      setQrLoadingId(null);
    }
  };

  const getReservationForMeal = (mealId) => {
    return reservations.find((r) => r.mealId === mealId);
  };

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🍽️ Yemekler</h1>

        {role === "Admin" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
          >
            {showForm ? "Vazgeç" : "Yeni Yemek"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 text-green-700 text-sm p-3 rounded mb-4">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow p-6 mb-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yemek Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiyat (₺)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min={0}
              step="0.01"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontenjan
            </label>
            <input
              type="number"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              required
              min={1}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih
            </label>
            <input
              type="date"
              value={availableDate}
              onChange={(e) => setAvailableDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {meals.length === 0 && (
          <p className="text-gray-500">Henüz yemek yok.</p>
        )}

        {meals.map((meal) => {
          const reservation = getReservationForMeal(meal.id);
          const qrCode = reservation
            ? qrCodes[reservation.id]
            : null;

          const GRADIENTS = [
            "from-orange-400 to-rose-500",
            "from-emerald-400 to-teal-500",
            "from-violet-400 to-fuchsia-500",
            "from-amber-400 to-orange-500",
            "from-sky-400 to-blue-500",
            "from-lime-400 to-green-500",
          ];
          const EMOJIS = ["🍲", "🍛", "🥗", "🍝", "🍗", "🍜", "🥘", "🍱"];
          const idx = meal.id % GRADIENTS.length;
          const emojiIdx = meal.id % EMOJIS.length;

          return (
            <div
              key={meal.id}
              className="bg-white rounded-xl shadow overflow-hidden"
            >
              <div
                className={`w-full h-32 bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center text-6xl`}
              >
                {EMOJIS[emojiIdx]}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{meal.name}</h3>

                    {meal.description && (
                      <p className="text-gray-600 mt-2">
                        {meal.description}
                      </p>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      💰 {meal.price} ₺
                    </p>

                    <p className="text-sm text-gray-500">
                      🗓️{" "}
                      {new Date(meal.availableDate).toLocaleDateString(
                        "tr-TR"
                      )}
                    </p>

                    <p className="text-sm text-gray-500">
                      👥 Kontenjan: {meal.quota}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Durum: {meal.isActive ? "Aktif" : "Pasif"}
                    </p>
                  </div>

                  {role === "Student" && (
                    <div className="flex flex-col items-end gap-2">
                      {!reservation && meal.isActive && (
                        <button
                          onClick={() => handleReserve(meal.id)}
                          disabled={reservingId === meal.id}
                          className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {reservingId === meal.id
                            ? "Rezerve ediliyor..."
                            : "Rezervasyon Yap"}
                        </button>
                      )}

                      {reservation &&
                        reservation.status === "Reserved" &&
                        !reservation.qrUsed && (
                          <button
                            onClick={() =>
                              handleGenerateQr(reservation.id)
                            }
                            disabled={qrLoadingId === reservation.id}
                            className="bg-purple-600 text-white px-4 py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {qrLoadingId === reservation.id
                              ? "Oluşturuluyor..."
                              : qrCode
                              ? "QR'ı Yenile"
                              : "QR Oluştur"}
                          </button>
                        )}

                      {reservation && reservation.qrUsed && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full whitespace-nowrap">
                          QR Kullanıldı
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {qrCode && (
                  <div className="mt-4 flex flex-col items-center border-t pt-4">
                    <img
                      src={qrCode}
                      alt="Yemek QR Kodu"
                      className="w-40 h-40"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Bu QR kodu yemekhanede gösterin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Meals;
