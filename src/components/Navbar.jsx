import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const ROLE_LABELS = {
  Admin: "Yönetici",
  Faculty: "Öğretim Üyesi",
  Student: "Öğrenci",
};

function NavDropdown({ label, items, isActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
          isActive || open
            ? "bg-violet-50 text-violet-700"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {label}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-20">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-violet-700 transition"
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => {
        setRole(res.data.role);
        setName(res.data.firstName || res.data.name || "");
      })
      .catch((err) => console.error("NAVBAR ROLE ERROR:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const attendanceLink =
    role === "Student"
      ? { to: "/my-attendance", label: "Devamsızlığım" }
      : { to: "/attendance", label: "Devamsızlık" };

  const directLinks = [
    { to: "/dashboard", label: "Ana Sayfa", icon: "🏠" },
  ];

  const akademikItems = [
    { to: "/courses", label: "Dersler", icon: "📚" },
    ...(role === "Student"
      ? [{ to: "/my-courses", label: "Derslerim", icon: "🎒" }]
      : []),
    { to: "/grades", label: "Notlar", icon: "📝" },
    { to: attendanceLink.to, label: attendanceLink.label, icon: "📍" },
    ...(role === "Faculty"
      ? [{ to: "/attendance/start", label: "Yoklama Başlat", icon: "▶️" }]
      : []),
  ];

  const kampusItems = [
    { to: "/announcements", label: "Duyurular", icon: "📢" },
    { to: "/events", label: "Etkinlikler", icon: "🎉" },
    { to: "/meals", label: "Yemekler", icon: "🍽️" },
    { to: "/scheduling", label: "Ders Programı", icon: "🗓️" },
    { to: "/payments", label: "Ödemeler", icon: "💳" },
  ];

  const yonetimItems = [
    ...(role === "Faculty" || role === "Admin"
      ? [{ to: "/excuse-requests", label: "Mazeret Talepleri", icon: "📄" }]
      : []),
    ...(role === "Faculty" || role === "Admin"
      ? [{ to: "/course-management", label: "Ders Yönetimi", icon: "🛠️" }]
      : []),
  ];

  const isInGroup = (items) => items.some((i) => i.to === location.pathname);

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 text-white flex items-center justify-center text-base shadow-sm">
            🎓
          </span>
          <span className="text-lg font-bold text-slate-900 hidden sm:block">
            Akıllı Kampüs
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {directLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname === link.to
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <NavDropdown
            label="Akademik"
            items={akademikItems}
            isActive={isInGroup(akademikItems)}
          />
          <NavDropdown
            label="Kampüs"
            items={kampusItems}
            isActive={isInGroup(kampusItems)}
          />
          {yonetimItems.length > 0 && (
            <NavDropdown
              label="Yönetim"
              items={yonetimItems}
              isActive={isInGroup(yonetimItems)}
            />
          )}

          <Link
            to="/profile"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              location.pathname === "/profile"
                ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Profil
          </Link>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {role && (
            <div className="hidden lg:flex flex-col items-end leading-tight">
              {name && (
                <span className="text-sm font-semibold text-slate-800">
                  {name}
                </span>
              )}
              <span className="text-xs text-violet-600 font-medium">
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Mobil menü */}
      <div className="md:hidden flex flex-wrap gap-1 px-4 pb-3">
        {[
          ...directLinks,
          { to: "/profile", label: "Profil" },
          ...akademikItems,
          ...kampusItems,
          ...yonetimItems,
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              location.pathname === link.to
                ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
