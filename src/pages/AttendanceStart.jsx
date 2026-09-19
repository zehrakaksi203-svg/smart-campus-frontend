import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { createSession, getMySessions, closeSession, refreshQrCode } from "../api/attendanceSession";
import { getAllCourseSections } from "../api/courses";

const MOCK_LOCATION_ENABLED =
  import.meta.env.VITE_ENABLE_MOCK_LOCATION === "true";

function AttendanceStart() {
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [radius, setRadius] = useState(30);
  const [useAutoLocation, setUseAutoLocation] = useState(true);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Mock konum modu (sadece test/demo amaçlı)
  const [mockMode, setMockMode] = useState(false);
  const [mockLat, setMockLat] = useState("");
  const [mockLng, setMockLng] = useState("");

  const [session, setSession] = useState(null);
  const [mySessions, setMySessions] = useState([]);
  const [sections, setSections] = useState([]);
    // QR kodu her 5 saniyede bir otomatik yeniler (session açıkken)
    useEffect(() => {
      if (!session || !session.id || !session.qrCode) return;
  
      const interval = setInterval(async () => {
        try {
          const res = await refreshQrCode(session.id);
          const newQrCode = res.data?.qrCode;
  
          if (newQrCode) {
            setSession((prev) => (prev ? { ...prev, qrCode: newQrCode } : prev));
          }
        } catch (err) {
          console.error("QR yenilenemedi:", err);
        }
      }, 5000);
  
      return () => clearInterval(interval);
    }, [session?.id]);

  const loadSessions = async () => {
    try {
      const res = await getMySessions();
      setMySessions(res.data);
    } catch (err) {
      console.error("Oturumlar yüklenemedi:", err);
    }
  };

  const loadSections = async () => {
    try {
      const res = await getAllCourseSections();
      console.log("SECTION LİSTESİ:", res.data);
      setSections(res.data);
    } catch (err) {
      console.error("Sectionlar yüklenemedi:", err);
    }
  };

  useEffect(() => {
    loadSessions();
    loadSections();
  }, []);

  const getPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Bu tarayıcı konum servisini desteklemiyor.")
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("========== ÖĞRETMEN GPS ==========");
          console.log("Latitude:", position.coords.latitude);
          console.log("Longitude:", position.coords.longitude);
          console.log("Accuracy:", position.coords.accuracy);

          resolve(position);
        },
        (error) => {
          console.error("GPS HATASI:", error);

          if (error.code === 1) {
            reject(
              new Error(
                "Konum izni verilmedi. Tarayıcıdan konum iznini açın."
              )
            );
          } else if (error.code === 2) {
            reject(new Error("Konum alınamadı."));
          } else if (error.code === 3) {
            reject(
              new Error("Konum alınırken zaman aşımına uğradı.")
            );
          } else {
            reject(new Error("Konum alınamadı."));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });

  // Oturumu kapat (önceden yanlışlıkla handleCreateSession içinde tanımlıydı, buraya taşındı)
  const handleCloseSession = async (id) => {
    setError("");
    setMessage("");
    try {
      await closeSession(id);
      setMessage("Oturum kapatıldı.");
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || "Oturum kapatılamadı.");
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    setCreating(true);
    setError("");
    setMessage("");
    setSession(null);

    try {
      if (!sectionId) {
        throw new Error("Lütfen bir ders/section seçiniz.");
      }

      if (!date) {
        throw new Error("Tarih seçiniz.");
      }

      if (!startTime || !endTime) {
        throw new Error("Başlangıç ve bitiş saatlerini giriniz.");
      }
      if (date === todayStr) {
        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`;

        if (startTime < currentTimeStr) {
          throw new Error("Bugün için geçmiş bir saat seçemezsiniz.");
        }
      }

      // Mock modda konum girildiyse doğrulayalım
      if (mockMode && !useAutoLocation) {
        if (mockLat === "" || mockLng === "") {
          throw new Error("Manuel konum için enlem ve boylam giriniz.");
        }

        const latNum = parseFloat(mockLat);
        const lngNum = parseFloat(mockLng);

        if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
          throw new Error("Geçerli bir enlem ve boylam girin.");
        }

        if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
          throw new Error("Enlem -90/90, boylam -180/180 aralığında olmalı.");
        }
      }

      console.log("========== OTURUM OLUŞTURULUYOR ==========");
      console.log("Section ID:", sectionId);
      console.log("Tarih:", date);
      console.log("Başlangıç:", startTime);
      console.log("Bitiş:", endTime);
      console.log("Geofence:", radius);
      console.log("Mock mode:", mockMode);

      let requestData = {
        sectionId: Number(sectionId),
        date,
        startTime,
        endTime,
        geofenceRadius: Number(radius),
      };

      if (useAutoLocation) {
        console.log("Sınıfın kayıtlı GPS konumu otomatik kullanılacak.");
      } else if (mockMode) {
        console.log("========== ÖĞRETMEN MOCK KONUM ==========");
        console.log("Latitude:", mockLat);
        console.log("Longitude:", mockLng);

        requestData.latitude = parseFloat(mockLat);
        requestData.longitude = parseFloat(mockLng);
      } else {
        const pos = await getPosition();
        requestData.latitude = pos.coords.latitude;
        requestData.longitude = pos.coords.longitude;
      }

      console.log("BACKEND'E GÖNDERİLEN VERİ:", requestData);

      const res = await createSession(requestData);

      console.log("========== OTURUM OLUŞTURULDU ==========");
      console.log("Response:", res.data);

      const createdSession = res.data?.session || res.data;

      setSession(createdSession);

      setMessage("Yoklama oturumu başarıyla açıldı.");

      await loadSessions();

      setSectionId("");
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      console.error("========== OTURUM AÇMA HATASI ==========");
      console.error("HATA:", err);
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Oturum açılamadı."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        📅 Yoklama Oturumu Başlat
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-4 rounded mb-4">
          ❌ {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 text-green-700 text-sm p-4 rounded mb-4">
          ✅ {message}
        </div>
      )}

      {/* OTURUM OLUŞTURMA */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <form
          onSubmit={handleCreateSession}
          className="grid md:grid-cols-2 gap-4"
        >
          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ders / Section
            </label>

            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seçiniz</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.course?.courseCode
                    ? `${s.course.courseCode} - ${s.course.courseName} (Şube ${s.sectionCode})`
                    : `Section #${s.id} (Şube ${s.sectionCode})`}
                </option>
              ))}
            </select>
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayStr}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Başlangıç */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlangıç Saati
            </label>

            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Bitiş */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bitiş Saati
            </label>

            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Geofence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Geofence Yarıçapı (metre)
            </label>

            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              min="1"
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />

            <p className="text-xs text-gray-500 mt-1">
              Öğrencinin öğretmenin konumundan kaç metre uzaklıkta
              yoklama verebileceğini belirler.
            </p>
          </div>

          {/* Otomatik Sınıf Konumu */}
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            <input
              type="checkbox"
              id="useAutoLocation"
              checked={useAutoLocation}
              onChange={(e) => setUseAutoLocation(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="useAutoLocation" className="text-sm text-gray-700">
              Sınıfın kayıtlı GPS konumunu otomatik kullan (öğretmen konumu almaya gerek yok)
            </label>
          </div>

          {/* Mock konum modu (sadece test/demo amaçlı) */}
          {MOCK_LOCATION_ENABLED && !useAutoLocation && (
            <div className="md:col-span-2 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <label className="flex items-center gap-2 font-semibold text-yellow-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mockMode}
                  onChange={(e) => setMockMode(e.target.checked)}
                />
                🧪 Oturum konumunu manuel gir (test modu)
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
                </div>
              )}
            </div>
          )}

          {/* Buton */}
          <button
            type="submit"
            disabled={creating}
            className="md:col-span-2 bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {creating
              ? "📍 Konum alınıyor ve oturum açılıyor..."
              : "🟢 Yoklama Oturumu Başlat"}
          </button>
        </form>
      </div>

      {/* OLUŞTURULAN OTURUM */}
      {session && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 text-center">
          <h2 className="font-bold text-xl mb-4">
            ✅ Aktif Yoklama Oturumu
          </h2>

          <div className="bg-blue-50 rounded-lg p-4 mb-5">
            <p className="text-sm text-gray-500">
              Öğrenciler QR kodu okutarak veya konum üzerinden yoklama verebilir.
            </p>
          </div>

          {session.qrCode && (
            <>
              
              <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
  📷 QR Yoklama Kodu
  <span className="text-xs font-normal text-emerald-600 flex items-center gap-1">
    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
    canlı
  </span>
</h3>

              <div className="flex justify-center">
                <QRCode
                  value={session.qrCode}
                  size={200}
                />
              </div>

              <p className="mt-3 text-sm text-gray-500 break-all">
                {session.qrCode}
              </p>
            </>
          )}

          <div className="mt-6">
            <Link
              to={`/attendance/report/${session.sectionId}`}
              className="inline-block bg-gray-700 text-white px-5 py-2 rounded font-semibold hover:bg-gray-800"
            >
              📊 Yoklama Raporunu Gör
            </Link>
          </div>
        </div>
      )}

      {/* ÖNCEKİ OTURUMLAR */}
      {mySessions.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">
            📋 Açık Oturumlarım
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {mySessions.map((s) => (
              <div
                key={s.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <p className="font-semibold">
                  Oturum #{s.id}
                </p>

                <p className="text-sm text-gray-600">
                  Section #{s.sectionId}
                </p>

                <p className="text-sm text-gray-500">
                  {s.date}
                </p>

                <p className="text-sm text-gray-500 mb-3">
                  {s.startTime} - {s.endTime}
                </p>

                <span
                  className={
                    s.status === "Open"
                      ? "inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold mb-3"
                      : "inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold mb-3"
                  }
                >
                  {s.status}
                </span>
                {s.status === "Open" && (
                  <button
                    onClick={() => handleCloseSession(s.id)}
                    className="w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 mb-2"
                  >
                    Oturumu Kapat
                  </button>
                )}
                <Link
                  to={`/attendance/report/${s.sectionId}`}
                  className="block text-center bg-gray-700 text-white py-2 rounded font-semibold hover:bg-gray-800"
                >
                  Raporu Gör
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/attendance"
        className="inline-block mt-2 text-blue-600 font-medium hover:underline"
      >
        ← Devamsızlık ana sayfasına dön
      </Link>
    </div>
  );
}

export default AttendanceStart;
