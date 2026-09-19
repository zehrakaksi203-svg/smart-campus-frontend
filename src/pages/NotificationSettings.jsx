import { useEffect, useState } from "react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../api/notifications";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition relative shrink-0 ${
        checked ? "bg-violet-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function NotificationSettings() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getNotificationPreferences();
        setPreferences(res.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Bildirim tercihleri yüklenirken bir hata oluştu."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleToggle = (field) => async (value) => {
    const previous = preferences;
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const res = await updateNotificationPreferences({ [field]: value });
      setPreferences(res.data.data);
      setMessage("Tercihler güncellendi.");
    } catch (err) {
      setPreferences(previous);
      setError(
        err.response?.data?.message || "Tercihler güncellenemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  const channels = [
    {
      key: "email",
      icon: "📧",
      label: "E-posta Bildirimleri",
      desc: "Önemli güncellemeler için e-posta al.",
    },
    {
      key: "push",
      icon: "🔔",
      label: "Anlık Bildirimler",
      desc: "Uygulama içi anlık bildirimler al.",
    },
    {
      key: "sms",
      icon: "📱",
      label: "SMS Bildirimleri",
      desc: "Kritik durumlar için SMS al.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-6 md:p-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          ⚙️ Bildirim Ayarları
        </h1>

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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {channels.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between gap-4 p-5"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800">{c.label}</p>
                  <p className="text-sm text-slate-500">{c.desc}</p>
                </div>
              </div>
              <Toggle
                checked={!!preferences[c.key]}
                onChange={handleToggle(c.key)}
              />
            </div>
          ))}
        </div>

        {saving && (
          <p className="text-xs text-slate-400 mt-3">Kaydediliyor...</p>
        )}
      </div>
    </div>
  );
}

export default NotificationSettings;