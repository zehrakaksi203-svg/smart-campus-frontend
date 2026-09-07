import { useEffect, useState } from "react";
import api from "../api/axios";
import { getAllCourses, createCourse, deleteCourse } from "../api/courses";
import { getAllDepartments } from "../api/departments";
import { getAllFaculties, getAllUsers } from "../api/faculties";

function CourseManagement() {
  const [role, setRole] = useState(null);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [credit, setCredit] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const facultyDisplayName = (faculty) => {
    const user = users.find((u) => u.id === faculty.userId);
    return user?.fullName || `Öğretim Üyesi #${faculty.id}`;
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const meRes = await api.get("/users/me");
      setRole(meRes.data.role);

      const [coursesRes, departmentsRes, facultiesRes] = await Promise.all([
        getAllCourses(),
        getAllDepartments(),
        getAllFaculties(),
      ]);
      setCourses(coursesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setFaculties(facultiesRes.data || []);

      // Kullanıcı isimleri sadece Admin'e açık olabilir — başarısız olursa
      // sayfanın geri kalanını etkilemesin, sadece isimler yerine ID gösterilir
      try {
        const usersRes = await getAllUsers();
        setUsers(usersRes.data?.users || []);
      } catch (usersErr) {
        console.warn("Kullanıcı listesi alınamadı (yetki kısıtlı olabilir):", usersErr);
        setUsers([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Dersler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !courseCode ||
      !courseName ||
      !credit ||
      !departmentId ||
      !facultyId ||
      !semester ||
      !year
    ) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }

    setCreating(true);
    try {
      await createCourse({
        courseCode,
        courseName,
        credit: Number(credit),
        departmentId: Number(departmentId),
        facultyId: Number(facultyId),
        semester,
        year: Number(year),
      });

      setMessage("Ders başarıyla eklendi.");
      setCourseCode("");
      setCourseName("");
      setCredit("");
      setDepartmentId("");
      setFacultyId("");
      setSemester("");
      setYear("");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Ders eklenirken bir hata oluştu."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Bu dersi silmek istediğinize emin misiniz?")) {
      return;
    }

    setError("");
    setMessage("");
    setDeletingId(id);
    try {
      await deleteCourse(id);
      setMessage("Ders silindi.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Ders silinirken bir hata oluştu. (Şubesi olan bir ders silinemeyebilir.)"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  if (role !== "Admin" && role !== "Faculty") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">
          Bu sayfaya erişim yetkiniz yok.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-slate-900">
          Ders Yönetimi
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Yeni ders ekleyin veya mevcut dersleri silin.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-lg mb-4">
            {message}
          </div>
        )}

        {/* Ders Ekleme Formu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-slate-900 mb-4">Yeni Ders Ekle</h2>

          <form
            onSubmit={handleCreateCourse}
            className="grid md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ders Kodu
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="CENG301"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ders Adı
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Yazılım Mühendisliği"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kredi
              </label>
              <input
                type="number"
                min="1"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="3"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bölüm
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Seçiniz</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Öğretim Üyesi
              </label>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Seçiniz</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {facultyDisplayName(f)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dönem
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Seçiniz</option>
                <option value="Güz">Güz</option>
                <option value="Bahar">Bahar</option>
                <option value="Yaz">Yaz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Yıl
              </label>
              <input
                type="number"
                min="2000"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="md:col-span-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition"
            >
              {creating ? "Ekleniyor..." : "Dersi Ekle"}
            </button>
          </form>
        </div>

        {/* Ders Listesi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Mevcut Dersler</h2>

          {courses.length === 0 ? (
            <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              Henüz ders eklenmemiş.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {course.courseCode} — {course.courseName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {course.credit ?? "—"} kredi
                      {course.department?.name
                        ? ` · ${course.department.name}`
                        : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    disabled={deletingId === course.id}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === course.id ? "Siliniyor..." : "Sil"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseManagement;
