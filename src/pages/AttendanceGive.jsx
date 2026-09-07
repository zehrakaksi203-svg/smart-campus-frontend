import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { checkIn } from "../api/attendanceSession";

const MOCK_LOCATION_ENABLED =
  import.meta.env.VITE_ENABLE_MOCK_LOCATION === "true";

function AttendanceGive() {
  const { sessionId } = useParams();

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Mock konum modu (sadece test/demo amaçlı)
  const [mockMode, setMockMode] = useState(false);
  const [mockLat, setMockLat] = useState("");
  const [mockLng, setMockLng] = useState("");

  // GPS konumunu al
  const getLocation = () => {
    setLoading(true);
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Tarayıcınız konum servisini desteklemiyor.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("========== GPS KONUMU ==========");
        console.log("Latitude:", position.coords.latitude);
        console.log("Longitude:", position.coords.longitude);
        console.log("Accuracy:", position.coords.accuracy);

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLoading(false);
      },
      (err) => {
        console.error("========== GPS HATASI ==========");
        console.error(err);

        if (err.code === 1) {
          setError(
            "Konum izni verilmedi. Tarayıcıdan konum iznini açın."
          );
        } else if (err.code === 2) {
          setError("Konum alınamadı.");
        } else if (err.code === 3) {
          setError("Konum alınırken zaman aşımına uğradı.");
        } else {
          setError("Konum alınamadı.");
        }

        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (!mockMode) {
      getLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode]);

  // Mock modu açıp kapatma
  const toggleMockMode = () => {
    setError("");
    setMessage("");

    if (!mockMode) {
      // Mock moda geçerken gerçek konumu başlangıç değeri olarak koy (varsa)
      if (location) {
        setMockLat(String(location.latitude));
        setMockLng(String(location.longitude));
      }
      setMockMode(true);
      setLoading(false);
    } else {
      setMockMode(false);
      setLocation(null);
    }
  };

  // Mock koordinatları uygula
  const applyMockLocation = () => {
    setError("");

    const lat = parseFloat(mockLat);
    const lng = parseFloat(mockLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Geçerli bir enlem ve boylam girin.");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Enlem -90/90, boylam -180/180 aralığında olmalı.");
      return;
    }

    console.log("========== MOCK KONUM UYGULANDI ==========");
    console.log("Latitude:", lat);
    console.log("Longitude:", lng);

    setLocation({
      latitude: lat,
      longitude: lng,
      accuracy: 0,
    });
  };

  // GPS ile yoklama ver
  const handleCheckIn = async () => {
    if (!sessionId) {
      setError("Oturum ID bulunamadı.");
      return;
    }

    if (!location) {
      setError("Önce konumunuzun alınması gerekiyor.");
      return;
    }

    setCheckingIn(true);
    setError("");
    setMessage("");

    try {
      console.log("========== GPS CHECK-IN ==========");
      console.log("Session ID:", sessionId);
      console.log("Latitude:", location.latitude);
      console.log("Longitude:", location.longitude);
      console.log("Accuracy:", location.accuracy);
      console.log("Mock mode:", mockMode);

      const response = await checkIn(sessionId, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      console.log("========== CHECK-IN BAŞARILI ==========");
      console.log("Response:", response.data);

      setMessage(
        response.data?.message || "Yoklama başarıyla verildi."
      );
    } catch (err) {
      console.error("========== CHECK-IN HATASI ==========");
      console.error("HATA:", err);
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
      console.error("MESSAGE:", err.message);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Yoklama verilirken bir hata oluştu."
      );
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        📍 GPS ile Yoklama Ver
      </h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">

        <h2 className="text-xl font-bold mb-4">
          Yoklama Oturumu #{sessionId}
        </h2>

        {/* Mock konum modu (sadece test/demo amaçlı) */}
        {MOCK_LOCATION_ENABLED && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
            <label className="flex items-center gap-2 font-semibold text-yellow-800 cursor-pointer">
              <input
                type="checkbox"
                checked={mockMode}
                onChange={toggleMockMode}
              />
              🧪 Konumu manuel gir (test modu)
            </label>

            {mockMode && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Enlem (latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={mockLat}
                    onChange={(e) => setMockLat(e.target.value)}
                    placeholder="39.9208"
                    className="border rounded px-2 py-1 w-40"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Boylam (longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={mockLng}
                    onChange={(e) => setMockLng(e.target.value)}
                    placeholder="32.8541"
                    className="border rounded px-2 py-1 w-40"
                  />
                </div>

                <button
                  type="button"
                  onClick={applyMockLocation}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700"
                >
                  Konumu Uygula
                </button>
              </div>
            )}
          </div>
        )}

        {/* Konum alınıyor */}
        {loading && (
          <div className="bg-blue-100 text-blue-700 p-4 rounded mb-4">
            📍 Konumunuz alınıyor...
          </div>
        )}

        {/* Hata */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            ❌ {error}
          </div>
        )}

        {/* Başarılı */}
        {message && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
            ✅ {message}
          </div>
        )}

        {/* Konum bilgileri */}
        {location && (
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="font-semibold mb-2">
              📍 Konumunuz: {mockMode && "(manuel girildi)"}
            </p>

            <p className="text-sm text-gray-600">
              Enlem: {location.latitude}
            </p>

            <p className="text-sm text-gray-600">
              Boylam: {location.longitude}
            </p>

            <p className="text-sm text-gray-600">
              GPS Doğruluğu:{" "}
              {mockMode ? "—" : `${Math.round(location.accuracy)} metre`}
            </p>
          </div>
        )}

        {/* Yoklama ver */}
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={!location || checkingIn}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {checkingIn
            ? "Yoklama Veriliyor..."
            : "📍 Yoklama Ver"}
        </button>

        {/* Konumu yenile (sadece gerçek GPS modunda) */}
        {!mockMode && (
          <button
            type="button"
            onClick={getLocation}
            disabled={loading || checkingIn}
            className="ml-3 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            🔄 Konumu Yenile
          </button>
        )}

        {/* Geri dön */}
        <div className="mt-6">
          <Link
            to="/my-attendance"
            className="text-blue-600 hover:underline"
          >
            ← Devamsızlığıma Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AttendanceGive;
