import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import ChatBot from "../components/ChatBot";
import Skeleton from "../components/Skeleton";
import campusBanner from "../assets/foto.jpg";

const ROLE_LABELS = {
  Admin: "Yönetici",
  Faculty: "Öğretim Üyesi",
  Student: "Öğrenci",
};

// Karşılama şeridinde birkaç saniyede bir değişen kampüs temalı görseller
const HIGHLIGHTS = [
  { emoji: "📚", text: "Bugün yeni bir şey öğrenmeye ne dersin?" },
  { emoji: "🎓", text: "Hedeflerine bir adım daha yaklaştın." },
  { emoji: "🗓️", text: "Ders programını kontrol etmeyi unutma." },
  { emoji: "🎉", text: "Kampüste bu hafta etkinlikler var." },
  { emoji: "📢", text: "Güncel duyuruları kaçırma." },
];

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl p-5 md:p-8 xl:p-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-8 w-72" />
          </div>
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>

        <div className="mb-8 min-h-44 rounded-3xl bg-white border border-slate-200 p-6 md:p-8">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-56 mb-3" />
          <Skeleton className="h-4 w-80 mb-4" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        <Skeleton className="h-3 w-32 mb-3" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Skeleton className="w-11 h-11 rounded-xl mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>

        <Skeleton className="h-3 w-16 mb-3" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RotatingHighlight() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HIGHLIGHTS.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = HIGHLIGHTS[index];

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 px-4 py-3 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
    >
      <span className="text-3xl" aria-hidden="true">
        {current.emoji}
      </span>
      <p className="text-sm font-semibold text-white">{current.text}</p>
    </div>
  );
}

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
    return <DashboardSkeleton />;
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
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl p-5 md:p-8 xl:p-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-600">Kampüs kontrol merkezi</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Bugün kampüste neler var?</h1>
          </div>
          <Link to="/scheduling" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600">Ders programını aç →</Link>
        </div>
        {/* Karşılama şeridi */}
        <div
  className="relative mb-8 min-h-44 overflow-hidden rounded-3xl text-white shadow-xl shadow-indigo-200"
  style={{
    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.05)), url(${campusBanner})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
          <div className="absolute bottom-[-110px] right-40 h-56 w-56 rounded-full bg-violet-400/30 blur-2xl" />
          <div className="relative h-full flex flex-col justify-center p-6 md:p-8">
            <p className="text-indigo-100 text-sm font-semibold">{greeting}</p>
            <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">
              {user.fullName}
            </h2>
            <p className="mt-2 max-w-md text-sm text-indigo-100">Derslerini, kampüs etkinliklerini ve güncel bildirimlerini tek yerden takip et.</p>
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <div className="mt-4 max-w-sm">
              <RotatingHighlight />
            </div>
          </div>
        </div>

        {/* Hızlı erişim kartları */}
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">
          Hızlı Erişim
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/70"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-lg ${c.color}`}
              >
                {c.icon}
              </div>
              <div className="flex items-center justify-between gap-2"><h4 className="font-bold text-slate-800">{c.title}</h4><span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500">→</span></div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{c.desc}</p>
            </Link>
          ))}
        </div>

        {/* AI Kampüs Asistanı */}
       
        {/* Hesap bilgisi */}
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3 mt-8">
          Hesap
        </h3>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
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
          {user.role === "Student" && <ChatBot />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;