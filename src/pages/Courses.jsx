import { useEffect, useState } from "react";
import api from "../api/axios";
import { getAllCourseSections } from "../api/courses";
import { getAllDepartments } from "../api/departments";
import { getMyEnrollments, createEnrollment } from "../api/enrollments";
import { Link } from "react-router-dom";

function Courses() {
  const [activeTab, setActiveTab] = useState("all");
  const [role, setRole] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollingId, setEnrollingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const meRes = await api.get("/users/me");
      const userRole = meRes.data.role;
      setRole(userRole);

      const [sectionsRes, departmentsRes] = await Promise.all([
        getAllCourseSections(),
        getAllDepartments(),
      ]);
      setAllSections(sectionsRes.data || []);
      setDepartments(departmentsRes.data || []);

      if (userRole === "Student") {
        const myRes = await getMyEnrollments();
        setMyCourses(myRes.data || []);
        setActiveTab("my");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Dersler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (sectionId) => {
    setEnrollingId(sectionId);
    setMessage("");
    setError("");
    try {
      await createEnrollment(sectionId);
      setMessage("Kayıt başarılı!");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setEnrollingId(null);
    }
  };

  const isEnrolled = (sectionId) =>
    myCourses.some((e) => e.sectionId === sectionId || e.section?.id === sectionId);

  const facultyName = (section) =>
    section.faculty?.user?.fullName ||
    section.instructor?.user?.fullName ||
    null;

  const filteredSections = allSections.filter((section) => {
    const course = section.course;
    if (!course) return false;

    const matchesSearch =
      searchTerm.trim() === "" ||
      course.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "" || String(course.departmentId) === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-slate-900">Dersler</h1>
        <p className="text-slate-500 text-sm mb-6">
          Ders şubelerini görüntüle, gün/saat/öğretim üyesi bilgilerine göz at.
        </p>

        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          {role === "Student" && (
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === "my"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Kayıtlı Derslerim
            </button>
          )}
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "all"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Açık Ders Şubeleri
          </button>
        </div>

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

        {activeTab === "all" && (
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Ders kodu veya adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">Tüm Bölümler</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "my" && role === "Student" && (
          <div className="grid md:grid-cols-2 gap-4">
            {myCourses.length === 0 && (
              <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-dashed border-slate-300 col-span-2">
                Henüz kayıtlı ders yok.
              </div>
            )}
            {myCourses.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
              >
                <h3 className="font-bold text-lg text-slate-900">
                  {enrollment.section?.course?.courseName || "Ders"}
                </h3>
                <p className="text-sm text-violet-600 font-semibold mt-1">
                  {enrollment.section?.course?.courseCode}
                </p>
                <div className="text-sm text-slate-500 mt-3 space-y-1">
                  <p>
                    Dönem: {enrollment.semester} — {enrollment.academicYear}
                  </p>
                  <p>
                    Öğretim Üyesi:{" "}
                    {enrollment.section?.faculty?.user?.fullName ||
                      enrollment.section?.instructor?.user?.fullName ||
                      "—"}
                  </p>
                  <p>
                    Saat: {enrollment.section?.dayOfWeek || "—"}{" "}
                    {enrollment.section?.startTime} - {enrollment.section?.endTime}
                  </p>
                  <p>Sınıf: {enrollment.section?.classroom || "—"}</p>
                </div>
                <span className="inline-block mt-3 badge-neutral text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-300">
                  {enrollment.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "all" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSections.length === 0 && (
              <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-dashed border-slate-300 col-span-full">
                Filtreye uyan ders bulunamadı.
              </div>
            )}
            {filteredSections.map((section) => {
              const instructor = facultyName(section);
              const full =
                section.enrolledCount != null &&
                section.enrolledCount >= section.capacity;

              return (
                <div
                  key={section.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/courses/${section.courseId}`}
                          className="hover:text-violet-700 transition"
                        >
                          <h3 className="font-bold text-slate-900 leading-snug">
                            {section.course?.courseName || "Ders"}
                          </h3>
                        </Link>
                        <p className="text-sm text-violet-600 font-semibold mt-0.5">
                          {section.course?.courseCode}
                          {section.sectionCode ? ` · ${section.sectionCode}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                          full
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        }`}
                      >
                        {section.enrolledCount ?? 0}/{section.capacity ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <span className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-sm font-bold shrink-0">
                        {instructor ? instructor[0] : "?"}
                      </span>
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {instructor || "Öğretim üyesi atanmadı"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-500 mt-3">
                      <p className="flex items-center gap-1.5">
                        📅 {section.dayOfWeek || "—"}
                      </p>
                      <p className="flex items-center gap-1.5">
                        🕒 {section.startTime?.slice(0, 5) || "—"}
                        {section.endTime ? `–${section.endTime.slice(0, 5)}` : ""}
                      </p>
                      <p className="flex items-center gap-1.5">
                        📍 {section.classroom || "—"}
                      </p>
                      <p className="flex items-center gap-1.5">
                        🎓 {section.course?.credit ?? "—"} kredi
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Link
                      to={`/courses/${section.courseId}`}
                      className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Detayları Gör
                    </Link>

                    {role === "Student" && (
                      <button
                        onClick={() => handleEnroll(section.id)}
                        disabled={isEnrolled(section.id) || enrollingId === section.id || full}
                        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
                      >
                        {isEnrolled(section.id)
                          ? "Kayıtlısın"
                          : full
                          ? "Kontenjan Dolu"
                          : enrollingId === section.id
                          ? "Kaydediliyor..."
                          : "Kayıt Ol"}
                      </button>
                    )}

                    {(role === "Faculty" || role === "Admin") && (
                      <Link
                        to={`/gradebook/${section.id}`}
                        className="block w-full text-center bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                      >
                        Notları Gir
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;
