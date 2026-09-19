import { Navigate } from "react-router-dom";
import Navbar from "./Navbar";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const decoded = decodeToken(token);
    const role = decoded?.role;

    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <Navbar />
      <main className="pt-[73px] lg:pl-72">{children}</main>
    </div>
  );
}

export default ProtectedRoute;
