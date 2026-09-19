import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Skeleton from "../components/Skeleton";

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-7 w-24 mb-6" />
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <Skeleton className="h-20 w-full rounded-none" />
          <div className="flex flex-col items-center pt-6 px-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-40 mt-4" />
            <Skeleton className="h-4 w-56 mt-2" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-16 w-20 rounded-2xl" />
              <Skeleton className="h-16 w-20 rounded-2xl" />
              <Skeleton className="h-16 w-20 rounded-2xl" />
            </div>
          </div>
          <div className="px-6 pb-8 pt-6">
            <Skeleton className="h-3 w-32 mb-3" />
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl mb-3" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUser = () => {
    api.get("/users/me").then((res) => {
      setUser(res.data);
      setFullName(res.data.fullName);
      setEmail(res.data.email);
    });
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.put("/users/me", { fullName, email });
      setMessage("Profil güncellendi.");
      setEditing(false);
      loadUser();
    } catch (err) {
      setError(err.response?.data?.message || "Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <ProfileSkeleton />;
  }

  const studentProfile = user.studentProfile;
  const facultyProfile = user.facultyProfile;

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const roleLabel =
    user.role === "Student"
      ? "Öğrenci"
      : user.role === "Faculty"
      ? "Öğretim Üyesi"
      : user.role === "Admin"
      ? "Yönetici"
      : user.role;

  const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-100 transition">
      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800 truncate">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {message && (
          <div role="status" aria-live="polite" className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-lg mb-4">
            {message}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          {/* Cover */}
          <div className="relative h-24 bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 overflow-hidden">
            <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[20px] border-white/10" />
            <div className="absolute top-3 right-4">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md">
                {user.role === "Student" ? "🎓" : user.role === "Faculty" ? "🏛️" : "⚙️"}
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Avatar + name */}
          <div className="flex flex-col items-center pt-6 px-6">
            <div className="w-24 h-24 rounded-full bg-white shadow-lg p-1.5 -mt-16 relative z-10">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center text-3xl font-bold">
                {initials}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-4">
              {user.fullName}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>

            {studentProfile?.gpa !== undefined && (
              <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-sm">
                <div className="text-center px-3 py-3 rounded-2xl bg-violet-50 border border-violet-100">
                  <p className="text-lg font-bold text-violet-600">
                    {studentProfile.gpa}
                  </p>
                  <p className="text-[11px] text-violet-500 font-semibold uppercase">
                    GPA
                  </p>
                </div>
                <div className="text-center px-3 py-3 rounded-2xl bg-slate-100 border border-slate-200">
                  <p className="text-lg font-bold text-slate-600">
                    {studentProfile.classYear}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">
                    Sınıf
                  </p>
                </div>
                <div className="text-center px-3 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-lg font-bold text-emerald-600">
                    {studentProfile.status}
                  </p>
                  <p className="text-[11px] text-emerald-500 font-semibold uppercase">
                    Durum
                  </p>
                </div>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="px-6 pb-8 pt-6">
              {studentProfile && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                    Öğrenci Bilgileri
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <InfoItem icon="🆔" label="Öğrenci No" value={studentProfile.studentNumber} />
                    <InfoItem icon="🏫" label="Bölüm" value={studentProfile.department?.name} />
                  </div>
                </div>
              )}

              {facultyProfile && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                    Öğretim Üyesi Bilgileri
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <InfoItem icon="🆔" label="Sicil No" value={facultyProfile.employeeNumber} />
                    <InfoItem icon="🎓" label="Unvan" value={facultyProfile.title} />
                    <InfoItem icon="🔬" label="Uzmanlık" value={facultyProfile.specialization} />
                    <InfoItem icon="🚪" label="Ofis" value={facultyProfile.office} />
                    <InfoItem icon="🏫" label="Bölüm" value={facultyProfile.department?.name} />
                    <InfoItem icon="✅" label="Durum" value={facultyProfile.status} />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  to="/settings/notifications"
                  className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold transition"
                >
                  🔔 Bildirim Ayarları
                </Link>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition shadow-md"
                >
                  ✏️ Profili Düzenle
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="px-6 pb-8 pt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="profile-fullName" className="block text-sm font-medium text-slate-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  id="profile-fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium text-slate-700 mb-1">
                  E-posta
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  aria-busy={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold transition shadow-md"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;