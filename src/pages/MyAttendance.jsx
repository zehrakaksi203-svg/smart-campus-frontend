import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { getMyAttendance, checkInWithQr } from "../api/attendanceSession";
import { createExcuseRequest, getMyExcuseRequests } from "../api/excuseRequests";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
const QR_READER_ELEMENT_ID = "qr-reader";

const EXCUSE_GIVE_LINK_LABEL = "GPS ile Yoklama Ver";
const DOC_LINK_FALLBACK = "Belgeyi indir";

const RISK_STYLES = {
  Critical: { badge: "bg-red-100 text-red-700", bar: "bg-red-500", label: "Kritik" },
  Warning: { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500", label: "Uyarı" },
  default: { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", label: "İyi" },
};

const EXCUSE_STATUS_STYLES = {
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function MyAttendance() {
  const navigate = useNavigate();

  const [manualSessionId, setManualSessionId] = useState("");
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [myAttendance, setMyAttendance] = useState([]);

  const [myExcuses, setMyExcuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [excuseSessionId, setExcuseSessionId] = useState("");
  const [excuseReason, setExcuseReason] = useState("");
  const [submittingExcuse, setSubmittingExcuse] = useState(false);
  const [excuseFile, setExcuseFile] = useState(null);
  const [excuseFileError, setExcuseFileError] = useState("");

  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrMessage, setQrMessage] = useState("");
  const qrScannerRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [attRes, excRes] = await Promise.all([
        getMyAttendance(),
        getMyExcuseRequests(),
      ]);
      setMyAttendance(attRes.data);
      setMyExcuses(excRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Devamsızlık bilgileri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current
          .stop()
          .then(() => qrScannerRef.current.clear())
          .catch(() => {});
      }
    };
  }, []);

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        await qrScannerRef.current.clear();
      } catch (err) {}
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Tarayıcınız konum servisini desteklemiyor."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleShowMyLocation = async () => {
    setLocating(true);
    setLocationError("");
    try {
      const coords = await getCurrentPosition();
      setMyLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
    } catch (err) {
      setLocationError(
        err.code === 1 ? "Konum izni verilmedi." : err.message || "Konum alınamadı."
      );
    } finally {
      setLocating(false);
    }
  };

  const handleQrScanSuccess = async (decodedText) => {
    if (checkingIn) return;

    await stopScanner();
    setCheckingIn(true);
    setQrError("");
    setQrMessage("");

    try {
      const coords = await getCurrentPosition();
      const res = await checkInWithQr(decodedText, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const flagged = res.data?.record?.isFlagged || res.data?.isFlagged;
      setQrMessage(
        flagged
          ? "Yoklama alındı, ancak konum/hız kontrolünde işaretlendi."
          : "Yoklama başarıyla alındı."
      );
      await loadData();
    } catch (err) {
      if (err.code === 1) {
        setQrError("Konum izni verilmedi. Yoklama verebilmek için konum erişimine izin verin.");
      } else {
        setQrError(err.response?.data?.message || "Yoklama verilirken bir hata oluştu.");
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const startScanner = async () => {
    setQrError("");
    setQrMessage("");
    setScanning(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(QR_READER_ELEMENT_ID);
        qrScannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleQrScanSuccess(decodedText);
          },
          () => {}
        );
      } catch (err) {
        setQrError("Kamera başlatılamadı. Kamera izni verildiğinden emin olun.");
        setScanning(false);
      }
    }, 0);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Dosya okunamadı."));
      reader.readAsDataURL(file);
    });
  };

  const handleExcuseFileChange = (e) => {
    const file = e.target.files[0];
    setExcuseFileError("");
    if (file && file.size > 7 * 1024 * 1024) {
      setExcuseFileError("Dosya 7MB'dan büyük olamaz.");
      setExcuseFile(null);
      e.target.value = "";
      return;
    }
    setExcuseFile(file || null);
  };

  const handleSubmitExcuse = async (e) => {
    e.preventDefault();
    setSubmittingExcuse(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        sessionId: Number(excuseSessionId),
        reason: excuseReason,
      };

      if (excuseFile) {
        const base64 = await fileToBase64(excuseFile);
        payload.documentUrl = base64;
        payload.documentName = excuseFile.name;
        payload.documentType = excuseFile.type;
      }

      await createExcuseRequest(payload);
      setMessage("Mazeret talebi gönderildi.");
      setExcuseSessionId("");
      setExcuseReason("");
      setExcuseFile(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Mazeret talebi gönderilemedi.");
    } finally {
      setSubmittingExcuse(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  const giveAttendanceHref = "/attendance/give/" + manualSessionId;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-slate-900">Devamsızlığım</h1>
        <p className="text-slate-500 text-sm mb-6">
          Yoklama ver, katılım durumunu takip et, mazeret talebi gönder.
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

        {/* Ders bazlı katılım özet kartları */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {myAttendance.length === 0 && (
            <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-dashed border-slate-300 md:col-span-2">
              Henüz devamsızlık verisi yok.
            </div>
          )}
          {myAttendance.map((item, idx) => {
            const total = item.totalSessions ?? item.total ?? 0;
            const attended = item.attendedCount ?? item.attended ?? 0;
            const percentage = total > 0 ? Math.round((attended / total) * 100) : null;
            const risk = item.riskLevel || item.status;
            const style = RISK_STYLES[risk] || RISK_STYLES.default;

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-900">
                    {item.course?.courseName || item.courseName || "Ders"}
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${style.badge}`}>
                    {style.label}
                  </span>
                </div>

                {percentage != null && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">%{percentage} katılım</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-slate-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-slate-700">{total}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Toplam</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-emerald-600">{attended}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Katılım</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-amber-600">
                      {item.excusedCount ?? item.excused ?? 0}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Mazeretli</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* QR / GPS yoklama */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">📷 QR ile Yoklama Ver</h2>

          {qrError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
              {qrError}
            </div>
          )}
          {qrMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-lg mb-4">
              {qrMessage}
            </div>
          )}

          {!scanning && (
            <button
              onClick={startScanner}
              disabled={checkingIn}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              QR Kodu Tara
            </button>
          )}

          {scanning && (
            <div>
              <div id={QR_READER_ELEMENT_ID} className="w-full max-w-sm mx-auto rounded-lg overflow-hidden" />
              <button
                onClick={stopScanner}
                className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Taramayı İptal Et
              </button>
            </div>
          )}

          {checkingIn && <p className="text-sm text-slate-500 mt-3">Yoklama gönderiliyor...</p>}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="font-semibold text-sm text-slate-700 mb-1">📍 GPS ile Yoklama Ver</h3>
            <p className="text-sm text-slate-500 mb-3">
              QR kod çalışmazsa, hocanızın verdiği oturum ID'sini girerek GPS konumunuzla yoklama
              verebilirsiniz.
            </p>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Oturum ID"
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <Link
                to={giveAttendanceHref}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              >
                {EXCUSE_GIVE_LINK_LABEL}
              </Link>
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">📍 Konumum</h2>

          <button
            onClick={handleShowMyLocation}
            disabled={locating}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            {locating ? "Konum alınıyor..." : "Konumumu Göster"}
          </button>

          {locationError && <p className="text-red-600 text-sm mt-3">{locationError}</p>}

          {myLocation && (
            <div className="mt-4">
              <p className="text-sm text-slate-500 mb-2">
                Enlem: {myLocation.latitude.toFixed(6)}, Boylam: {myLocation.longitude.toFixed(6)} ·
                Hassasiyet: ~{Math.round(myLocation.accuracy)} m
              </p>
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <MapContainer
                  center={[myLocation.latitude, myLocation.longitude]}
                  zoom={17}
                  style={{ height: "300px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap katkıda bulunanlar"
                  />
                  <Marker position={[myLocation.latitude, myLocation.longitude]}>
                    <Popup>Şu anki konumun</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        {/* Mazeret talebi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-4">Mazeret Talebi Gönder</h2>
          <form onSubmit={handleSubmitExcuse} className="space-y-3">
            <input
              type="number"
              placeholder="Oturum ID"
              value={excuseSessionId}
              onChange={(e) => setExcuseSessionId(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <textarea
              placeholder="Mazeret sebebiniz"
              value={excuseReason}
              onChange={(e) => setExcuseReason(e.target.value)}
              required
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Belge (opsiyonel, örn. sağlık raporu)
              </label>
              <input
                type="file"
                onChange={handleExcuseFileChange}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              {excuseFile && (
                <p className="text-xs text-slate-500 mt-1">Seçilen dosya: {excuseFile.name}</p>
              )}
              {excuseFileError && <p className="text-xs text-red-600 mt-1">{excuseFileError}</p>}
            </div>
            <button
              type="submit"
              disabled={submittingExcuse}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {submittingExcuse ? "Gönderiliyor..." : "Talebi Gönder"}
            </button>
          </form>

          {myExcuses.length > 0 && (
            <div className="mt-6 space-y-2.5">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">
                Taleplerim
              </h3>
              {myExcuses.map((exc) => (
                <div
                  key={exc.id}
                  className="border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{exc.reason}</p>
                    {exc.documentUrl && (
                      <Link
                        to={exc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:underline"
                      >
                        📎 {exc.documentName || DOC_LINK_FALLBACK}
                      </Link>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                      EXCUSE_STATUS_STYLES[exc.status] || EXCUSE_STATUS_STYLES.Pending
                    }`}
                  >
                    {exc.status}
                  </span>
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

export default MyAttendance;
