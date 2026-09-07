import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Giriş başarısız, bilgileri kontrol et."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sol: görsel panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700/90 via-violet-600/85 to-fuchsia-600/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl backdrop-blur-md">
              🎓
            </span>
            <span className="text-xl font-bold">Akıllı Kampüs</span>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-serif italic leading-relaxed text-violet-50">
              "Bilgi, birlikte büyüdükçe değer kazanır."
            </p>
          </div>
          <p className="text-violet-200 text-xs">
            © {new Date().getFullYear()} Akıllı Kampüs
          </p>
        </div>
      </div>

      {/* Sağ: form paneli */}
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 justify-center mb-6">
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center text-lg">
              🎓
            </span>
            <span className="text-lg font-bold text-slate-900">Akıllı Kampüs</span>
          </div>

          <h1 className="text-2xl font-bold mb-1 text-slate-900">Giriş Yap</h1>
          <p className="text-sm text-slate-500 mb-6">
            Hesabına giriş yaparak devam et.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2.5 rounded-lg mb-4">
              {error}
            </div>
          )}

          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />

          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Şifre
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 text-white py-2.5 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <p className="text-sm text-center text-slate-500 mt-5">
            Hesabın yok mu?{" "}
            <Link to="/register" className="text-violet-600 font-semibold">
              Kayıt Ol
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
