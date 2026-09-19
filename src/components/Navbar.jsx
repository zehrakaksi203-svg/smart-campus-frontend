import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import NotificationBell from "./NotificationBell";
import Icon from "./Icon";
import GlobalSearch from "./GlobalSearch";

const ROLE_LABELS = { Admin: "Yönetici", Faculty: "Öğretim Üyesi", Student: "Öğrenci" };

function MenuLink({ to, icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
    >
      <span className="grid h-5 w-5 place-items-center">{icon}</span>
      {children}
    </NavLink>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("smart-campus-theme") === "dark");

  useEffect(() => {
    api.get("/users/me").then((res) => {
      setRole(res.data.role);
      setName(res.data.fullName || res.data.firstName || res.data.name || "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("smart-campus-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SC";

  return (
    <>
      <button type="button" aria-label="Menüyü aç" onClick={() => setMenuOpen(true)} className="fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"><Icon name="menu" className="h-5 w-5" /></button>
      {menuOpen && <button type="button" aria-label="Menüyü kapat" onClick={closeMenu} className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="mb-9 flex items-center justify-between px-2">
          <Link to="/dashboard" onClick={closeMenu} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-200"><Icon name="campus" className="h-5 w-5" /></span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">SmartCampus</span>
          </Link>
          <button type="button" onClick={closeMenu} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Menüyü kapat"><Icon name="close" className="h-5 w-5" /></button>
        </div>

        <nav className="space-y-1 overflow-y-auto pr-1">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Menü</p>
          <MenuLink to="/dashboard" icon={<Icon name="home" className="h-5 w-5" />} onClick={closeMenu}>Ana Sayfa</MenuLink>
          <MenuLink to="/profile" icon={<Icon name="user" className="h-5 w-5" />} onClick={closeMenu}>Profilim</MenuLink>
          <p className="mb-2 mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Akademik</p>
          <MenuLink to="/courses" icon={<Icon name="book" className="h-5 w-5" />} onClick={closeMenu}>Dersler</MenuLink>
          {role === "Student" && <MenuLink to="/my-courses" icon={<Icon name="book" className="h-5 w-5" />} onClick={closeMenu}>Derslerim</MenuLink>}
          <MenuLink to="/grades" icon={<Icon name="grade" className="h-5 w-5" />} onClick={closeMenu}>Notlar</MenuLink>
          <MenuLink to={role === "Student" ? "/my-attendance" : "/attendance"} icon={<Icon name="clock" className="h-5 w-5" />} onClick={closeMenu}>{role === "Student" ? "Devamsızlığım" : "Devamsızlık"}</MenuLink>
          {role === "Faculty" && <MenuLink to="/attendance/start" icon={<Icon name="clock" className="h-5 w-5" />} onClick={closeMenu}>Yoklama Başlat</MenuLink>}
          <MenuLink to="/scheduling" icon={<Icon name="calendar" className="h-5 w-5" />} onClick={closeMenu}>Ders Programı</MenuLink>
          <p className="mb-2 mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Kampüs Yaşamı</p>
          <MenuLink to="/announcements" icon={<Icon name="bell" className="h-5 w-5" />} onClick={closeMenu}>Duyurular</MenuLink>
          <MenuLink to="/events" icon={<Icon name="spark" className="h-5 w-5" />} onClick={closeMenu}>Etkinlikler</MenuLink>
          <MenuLink to="/meals" icon={<Icon name="meal" className="h-5 w-5" />} onClick={closeMenu}>Yemekler</MenuLink>
          <MenuLink to="/reservations" icon={<Icon name="ticket" className="h-5 w-5" />} onClick={closeMenu}>Rezervasyonlar</MenuLink>
          <MenuLink to="/payments" icon={<Icon name="card" className="h-5 w-5" />} onClick={closeMenu}>Ödemeler</MenuLink>
          {(role === "Faculty" || role === "Admin") && <>
            <p className="mb-2 mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Yönetim</p>
            <MenuLink to="/course-management" icon={<Icon name="settings" className="h-5 w-5" />} onClick={closeMenu}>Ders Yönetimi</MenuLink>
            <MenuLink to="/excuse-requests" icon={<Icon name="file" className="h-5 w-5" />} onClick={closeMenu}>Mazeret Talepleri</MenuLink>
            {role === "Admin" && <MenuLink to="/admin/dashboard" icon={<Icon name="chart" className="h-5 w-5" />} onClick={closeMenu}>Yönetici Paneli</MenuLink>}
          </>}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-5">
          <Link to="/settings/notifications" onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"><Icon name="settings" className="h-5 w-5" /> Bildirim Ayarları</Link>
          <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"><Icon name="logout" className="h-5 w-5" /> Çıkış Yap</button>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 h-[73px] border-b border-slate-200 bg-white/90 backdrop-blur lg:left-72">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-5 pl-20 lg:px-8">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => setDarkMode((value) => !value)} aria-label={darkMode ? "Açık temaya geç" : "Koyu temaya geç"} className="hidden h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 sm:grid"><Icon name={darkMode ? "sun" : "moon"} className="h-5 w-5" /></button>
            <NotificationBell />
            <Link to="/profile" className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition hover:bg-slate-50">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-xs font-bold text-white">{initials}</span>
              <span className="hidden text-left md:block"><span className="block max-w-32 truncate text-sm font-bold text-slate-800">{name || "Kullanıcı"}</span><span className="block text-xs font-medium text-indigo-600">{ROLE_LABELS[role] || "Hesabım"}</span></span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
