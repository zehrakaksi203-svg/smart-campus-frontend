import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../api/axios";
import { getAllAttendances } from "../api/attendance";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet varsayılan marker ikonu düzeltmesi (Vite ile bazen kırık gelir)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
import {
  checkIn,
  checkInWithQr,
  getMyAttendance,
} from "../api/attendanceSession";
import {
  createExcuseRequest,
  getMyExcuseRequests,
  getAllExcuseRequests,
  approveExcuseRequest,
  rejectExcuseRequest,
} from "../api/excuseRequests";

function Attendance() {
  const [role, setRole] = useState(null);
  const [me, setMe] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Student state
  const [myAttendance, setMyAttendance] = useState([]);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Excuse request state
  const [myExcuses, setMyExcuses] = useState([]);
  const [allExcuses, setAllExcuses] = useState([]);
  const [excuseSessionId, setExcuseSessionId] = useState("");
  const [excuseReason, setExcuseReason] = useState("");
  const [submittingExcuse, setSubmittingExcuse] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const meRes = await api.get("/users/me");
      setMe(meRes.data);
      setRole(meRes.data.role);

      const res = await getAllAttendances();
      let data = res.data;
      if (meRes.data.role === "Student") {
        data = data.filter((r) => r.enrollment?.student?.userId === meRes.data.id);
      }
      setRecords(data);

      if (meRes.data.role === "Student") {
        const excRes = await getMyExcuseRequests();
        setMyExcuses(excRes.data);
      }

      if (meRes.data.role === "Faculty" || meRes.data.role === "Admin") {
        const allExcRes = await getAllExcuseRequests();
        setAllExcuses(allExcRes.data);
      }

      if (meRes.data.role === "Student") {
        const attRes = await getMyAttendance();
        setMyAttendance(attRes.data);
      }
    } catch (err) {
      console.error("HATA DETAYI:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Devamsızlık bilgileri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const getPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Bu tarayıcı konum servisini desteklemiyor."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });

  const handleShowMyLocation = async () => {
    setLocating(true);
    setLocationError("");
    try {
      const pos = await getPosition();
      setMyLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    } catch (err) {
      setLocationError(err.message || "Konum alınamadı.");
    } finally {
      setLocating(false);
    }
  };

  const handleGpsCheckIn = async (sessionId) => {
    setError("");
    setMessage("");
    try {
      const pos = await getPosition();
      await checkIn(sessionId, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setMessage("Yoklama GPS ile kaydedildi.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Yoklama kaydedilemedi."
      );
    }
  };

  const handleSubmitExcuse = async (e) => {
    e.preventDefault();
    setSubmittingExcuse(true);
    setError("");
    setMessage("");
    try {
      await createExcuseRequest({
        sessionId: Number(excuseSessionId),
        reason: excuseReason,
      });
      setMessage("Mazeret talebi gönderildi.");
      setExcuseSessionId("");
      setExcuseReason("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Mazeret talebi gönderilemedi.");
    } finally {
      setSubmittingExcuse(false);
    }
  };

  const handleApproveExcuse = async (id) => {
    setError("");
    setMessage("");
    try {
      await approveExcuseRequest(id, "");
      setMessage("Mazeret talebi onaylandı.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "İşlem başarısız.");
    }
  };

  const handleRejectExcuse = async (id) => {
    setError("");
    setMessage("");
    try {
      await rejectExcuseRequest(id, "");
      setMessage("Mazeret talebi reddedildi.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "İşlem başarısız.");
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setError("");
    setMessage("");
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            await scanner.stop();
            setScanning(false);
            try {
              const pos = await getPosition();
              await checkInWithQr(decodedText, {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
              setMessage("Yoklama QR ile kaydedildi.");
              await loadData();
            } catch (err) {
              setError(
                err.response?.data?.message ||
                  err.message ||
                  "Yoklama kaydedilemedi."
              );
            }
          }
        );
      } catch (err) {
        setError("Kamera başlatılamadı: " + err.message);
        setScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
    }
    setScanning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">📅 Devamsızlık</h1>

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

      {/* STUDENT: Check-in */}
      {role === "Student" && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Yoklama Ver</h2>

          {!scanning ? (
            <button
              onClick={startScanner}
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
            >
              QR Kod Tara
            </button>
          ) : (
            <div>
              <div id="qr-reader" style={{ width: "100%", maxWidth: 350 }} />
              <button
                onClick={stopScanner}
                className="mt-3 bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-300"
              >
                Taramayı Durdur
              </button>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-4">
            Kamera çalışmazsa, hocandan oturum ID'sini alıp GPS ile de yoklama verebilirsin:
          </p>
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              placeholder="Oturum ID"
              id="manual-session-id"
              className="border border-gray-300 rounded px-3 py-2 flex-1"
            />
            <button
              onClick={() =>
                handleGpsCheckIn(
                  document.getElementById("manual-session-id").value
                )
              }
              className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700"
            >
              GPS ile Yoklama Ver
            </button>
          </div>
        </div>
      )}

      {/* STUDENT: Konumum (harita) */}
      {role === "Student" && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">📍 Konumum</h2>

          <button
            onClick={handleShowMyLocation}
            disabled={locating}
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {locating ? "Konum alınıyor..." : "Konumumu Göster"}
          </button>

          {locationError && (
            <p className="text-red-600 text-sm mt-3">{locationError}</p>
          )}

          {myLocation && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Enlem: {myLocation.latitude.toFixed(6)}, Boylam:{" "}
                {myLocation.longitude.toFixed(6)} · Hassasiyet: ~
                {Math.round(myLocation.accuracy)} m
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={[myLocation.latitude, myLocation.longitude]}
                  zoom={17}
                  style={{ height: "300px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap katkıda bulunanlar'
                  />
                  <Marker position={[myLocation.latitude, myLocation.longitude]}>
                    <Popup>Şu anki konumun</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDENT: Devamsızlık özeti */}
      {role === "Student" && myAttendance.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {myAttendance.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow p-5">
              <h3 className="font-bold">{item.course?.courseName || item.courseName}</h3>
              <p className="text-sm text-gray-600 mt-2">
                Katılım: {item.attendedCount ?? item.attended}/{item.totalSessions ?? item.total}
              </p>
              <span
                className={
                  item.riskLevel === "Critical" || item.status === "Critical"
                    ? "text-red-600 font-semibold"
                    : item.riskLevel === "Warning" || item.status === "Warning"
                    ? "text-yellow-600 font-semibold"
                    : "text-green-600 font-semibold"
                }
              >
                {item.riskLevel || item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STUDENT: Mazeret talebi gönder */}
      {role === "Student" && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Mazeret Talebi Gönder</h2>
          <form onSubmit={handleSubmitExcuse} className="space-y-4">
            <input
              type="number"
              placeholder="Oturum ID"
              value={excuseSessionId}
              onChange={(e) => setExcuseSessionId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <textarea
              placeholder="Mazeret sebebiniz"
              value={excuseReason}
              onChange={(e) => setExcuseReason(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <button
              type="submit"
              disabled={submittingExcuse}
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {submittingExcuse ? "Gönderiliyor..." : "Talebi Gönder"}
            </button>
          </form>

          {myExcuses.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-700">Taleplerim</h3>
              {myExcuses.map((exc) => (
                <div key={exc.id} className="border border-gray-200 rounded p-3">
                  <p className="text-sm">{exc.reason}</p>
                  <span
                    className={
                      exc.status === "Approved"
                        ? "text-green-600 font-semibold text-sm"
                        : exc.status === "Rejected"
                        ? "text-red-600 font-semibold text-sm"
                        : "text-yellow-600 font-semibold text-sm"
                    }
                  >
                    {exc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FACULTY/ADMIN: Mazeret talepleri onay/red */}
      {(role === "Faculty" || role === "Admin") && allExcuses.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Mazeret Talepleri</h2>
          <div className="space-y-3">
            {allExcuses.map((exc) => (
              <div
                key={exc.id}
                className="border border-gray-200 rounded p-4 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">
                    {exc.student?.user?.fullName || "Öğrenci"} — Session #{exc.sessionId}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{exc.reason}</p>
                  <span
                    className={
                      exc.status === "Approved"
                        ? "text-green-600 font-semibold text-sm"
                        : exc.status === "Rejected"
                        ? "text-red-600 font-semibold text-sm"
                        : "text-yellow-600 font-semibold text-sm"
                    }
                  >
                    {exc.status}
                  </span>
                </div>

                {exc.status === "Pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveExcuse(exc.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-700"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleRejectExcuse(exc.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-red-600"
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genel kayıt tablosu (herkes) */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {role !== "Student" && (
                <th className="text-left px-4 py-3">Öğrenci</th>
              )}
              <th className="text-left px-4 py-3">Ders</th>
              <th className="text-left px-4 py-3">Tarih</th>
              <th className="text-left px-4 py-3">Durum</th>
              <th className="text-left px-4 py-3">Not</th>
            </tr>
          </thead>

          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                {role !== "Student" && (
                  <td className="px-4 py-3">
                    {r.enrollment?.student?.studentNumber || "—"}
                  </td>
                )}
                <td className="px-4 py-3">
                  {r.enrollment?.course?.courseName || "—"}
                </td>
                <td className="px-4 py-3">
                  {new Date(r.attendanceDate).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      r.status === "Present"
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">{r.remarks || "—"}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={role !== "Student" ? 5 : 4}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Attendance;
