import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";
import Icon from "../components/Icon";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ fullName, email, password });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Kayıt başarısız, bilgileri kontrol et."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fc] p-6">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon name="grade" className="h-6 w-6" /></div>
          <h1 className="mb-2 text-xl font-extrabold text-emerald-600">
            Kayıt başarılı!
          </h1>
          <p className="mb-5 text-sm leading-6 text-slate-500">
            E-posta adresine gönderilen doğrulama linkine tıklayarak hesabını
            aktifleştir.
          </p>
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-5 py-10">
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 md:p-9"
      >
        <div className="mb-7 text-center"><div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white"><Icon name="campus" className="h-5 w-5" /></div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Hesabını oluştur</h1><p className="mt-2 text-sm text-slate-500">Akıllı Kampüs yolculuğuna başla.</p></div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label
          htmlFor="fullName"
          className="mb-1 block text-sm font-semibold text-slate-700"
        >
          Ad Soyad
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="mb-4 w-full border border-slate-300 px-3 py-2.5 text-sm"
        />

        <label
          htmlFor="email"
          className="mb-1 block text-sm font-semibold text-slate-700"
        >
          E-posta
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full border border-slate-300 px-3 py-2.5 text-sm"
        />

        <label
          htmlFor="password"
          className="mb-1 block text-sm font-semibold text-slate-700"
        >
          Şifre
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mb-6 w-full border border-slate-300 px-3 py-2.5 text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
        >
          {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Zaten hesabın var mı?{" "}
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
            Giriş Yap
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
