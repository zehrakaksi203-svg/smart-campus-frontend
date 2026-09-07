import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  getAllEvents,
  createEvent,
  registerForEvent,
  getMyRegistrations,
  generateEventQr,
} from "../api/events";

function Events() {
  const [role, setRole] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [registeringId, setRegisteringId] = useState(null);
  const [qrLoadingId, setQrLoadingId] = useState(null);
  const [qrCodes, setQrCodes] = useState({});

  const loadData = async () => {
    try {
      setError("");

      const meRes = await api.get("/users/me");
      const currentRole = meRes.data.role;
      setRole(currentRole);

      const eventsRes = await getAllEvents();
      setEvents(eventsRes.data.events || []);

      if (currentRole === "Student") {
        const regRes = await getMyRegistrations();
        setRegistrations(regRes.data.registrations || []);
      }
    } catch (err) {
      console.error("Events load error:", err);

      setError(
        err.response?.data?.message ||
          "Etkinlikler yüklenirken bir hata oluştu."
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
      await createEvent({
        title,
        description,
        eventDate,
        location,
        capacity: Number(capacity),
      });

      setMessage("Etkinlik oluşturuldu.");

      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
      setCapacity("");
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Etkinlik oluşturulamadı."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    setError("");
    setMessage("");

    try {
      await registerForEvent(eventId);
      setMessage("Etkinliğe kayıt oluşturuldu.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Kayıt oluşturulamadı."
      );
    } finally {
      setRegisteringId(null);
    }
  };

  const handleGenerateQr = async (registrationId) => {
    setQrLoadingId(registrationId);
    setError("");

    try {
      const res = await generateEventQr(registrationId);

      setQrCodes((prev) => ({
        ...prev,
        [registrationId]: res.data.data.qrCode,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "QR kod oluşturulamadı."
      );
    } finally {
      setQrLoadingId(null);
    }
  };

  const getRegistrationForEvent = (eventId) => {
    return registrations.find((r) => r.eventId === eventId);
  };

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🎉 Etkinlikler</h1>

        {(role === "Admin" || role === "Faculty") && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
          >
            {showForm ? "Vazgeç" : "Yeni Etkinlik"}
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
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              Tarih ve Saat
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konum
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontenjan
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              min={1}
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
        {events.length === 0 && (
          <p className="text-gray-500">Henüz etkinlik yok.</p>
        )}

        {events.map((event) => {
          const registration = getRegistrationForEvent(event.id);
          const qrCode = registration
            ? qrCodes[registration.id]
            : null;

          return (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{event.title}</h3>

                  {event.description && (
                    <p className="text-gray-600 mt-2">
                      {event.description}
                    </p>
                  )}

                  <p className="text-sm text-gray-500 mt-2">
                    📍 {event.location}
                  </p>

                  <p className="text-sm text-gray-500">
                    🗓️{" "}
                    {new Date(event.eventDate).toLocaleString("tr-TR")}
                  </p>

                  <p className="text-sm text-gray-500">
                    👥 Kontenjan: {event.capacity}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Durum: {event.status}
                  </p>
                </div>

                {role === "Student" && (
                  <div className="flex flex-col items-end gap-2">
                    {!registration && (
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={registeringId === event.id}
                        className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {registeringId === event.id
                          ? "Kaydediliyor..."
                          : "Kayıt Ol"}
                      </button>
                    )}

                    {registration &&
                      registration.status === "Registered" &&
                      !registration.qrUsed && (
                        <button
                          onClick={() =>
                            handleGenerateQr(registration.id)
                          }
                          disabled={qrLoadingId === registration.id}
                          className="bg-purple-600 text-white px-4 py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {qrLoadingId === registration.id
                            ? "Oluşturuluyor..."
                            : qrCode
                            ? "QR'ı Yenile"
                            : "QR Oluştur"}
                        </button>
                      )}

                    {registration && registration.qrUsed && (
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
                    alt="Etkinlik QR Kodu"
                    className="w-40 h-40"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Bu QR kodu girişte gösterin.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Events;