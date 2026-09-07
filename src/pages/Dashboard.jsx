import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

const ROLE_LABELS = {
  Admin: "Yönetici",
  Faculty: "Öğretim Üyesi",
  Student: "Öğrenci",
};

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        setError("Oturum süresi dolmuş veya kullanıcı bilgileri alınamadı.");
      }
    };

    fetchMe();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  const cards = [
    {
      to: "/profile",
      icon: "👤",
      title: "Profil",
      desc: "Profil bilgilerini görüntüle ve düzenle.",
      color: "bg-violet-50 text-violet-600",
    },
    {
      to: "/courses",
      icon: "📚",
      title: "Dersler",
      desc: "Kayıtlı olduğun dersleri görüntüle.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      to: user.role === "Student" ? "/my-attendance" : "/attendance",
      icon: "📍",
      title: "Devamsızlık",
      desc: "Devamsızlık bilgilerini incele.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      to: "/grades",
      icon: "📝",
      title: "Notlar",
      desc: "Sınav ve ders notlarını görüntüle.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      to: "/announcements",
      icon: "📢",
      title: "Duyurular",
      desc: "Son duyuruları görüntüle.",
      color: "bg-rose-50 text-rose-600",
    },
    {
      to: "/events",
      icon: "🎉",
      title: "Etkinlikler",
      desc: "Kampüs etkinliklerine göz at, kayıt ol.",
      color: "bg-fuchsia-50 text-fuchsia-600",
    },
    {
      to: "/meals",
      icon: "🍽️",
      title: "Yemekler",
      desc: "Yemek listesini gör ve rezervasyon yap.",
      color: "bg-orange-50 text-orange-600",
    },
    {
      to: "/scheduling",
      icon: "🗓️",
      title: "Ders Programı",
      desc: "Haftalık ders programını görüntüle.",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      to: "/payments",
      icon: "💳",
      title: "Ödemeler",
      desc: "Ödeme geçmişini görüntüle, öde.",
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Karşılama şeridi */}
        <div className="rounded-2xl mb-8 text-white shadow-sm relative overflow-hidden h-40 md:h-48">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700/90 via-violet-600/80 to-fuchsia-600/70" />
          <div className="relative h-full flex flex-col justify-center p-6 md:p-8">
            <p className="text-violet-100 text-sm font-medium">{greeting}</p>
            <h2 className="text-2xl md:text-3xl font-bold mt-1">
              {user.fullName}
            </h2>
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mt-3 backdrop-blur-md w-fit">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>

        {/* Hızlı erişim kartları */}
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">
          Hızlı Erişim
        </h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition block"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${c.color}`}
              >
                {c.icon}
              </div>
              <h4 className="font-bold text-slate-800">{c.title}</h4>
              <p className="text-slate-500 text-sm mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>

        {/* Hesap bilgisi */}
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3 mt-8">
          Hesap
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Ad Soyad</p>
              <p className="font-semibold text-slate-800 mt-0.5">{user.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">E-posta</p>
              <p className="font-semibold text-slate-800 mt-0.5">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Rol</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
