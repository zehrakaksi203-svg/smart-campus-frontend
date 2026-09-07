import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-lg transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-64 min-h-screen bg-white shadow-lg p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-8">
        🎓 Smart Campus
      </h1>

      <nav className="space-y-2">
        <NavLink to="/dashboard" className={linkClass}>
          🏠 Dashboard
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
          👤 Profil
        </NavLink>

        <NavLink to="/courses" className={linkClass}>
          📚 Dersler
        </NavLink>

        <NavLink to="/attendance" className={linkClass}>
          📅 Devamsızlık
        </NavLink>

        <NavLink to="/grades" className={linkClass}>
          📝 Notlar
        </NavLink>

        <NavLink to="/announcements" className={linkClass}>
          📢 Duyurular
        </NavLink>
        <NavLink to="/events" className={linkClass}>
          🎉 Etkinlikler
        </NavLink>
      </nav>

      <button
        onClick={logout}
        className="mt-10 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
      >
        🚪 Çıkış Yap
      </button>
    </aside>
  );
}

export default Sidebar;