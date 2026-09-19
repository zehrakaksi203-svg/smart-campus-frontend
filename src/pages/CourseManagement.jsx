import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  getAllCourses,
  createCourse,
  deleteCourse,
  createCourseSection,
  getAllCourseSections,
} from "../api/courses";
import { getAllDepartments } from "../api/departments";
import { getAllFaculties, getAllUsers } from "../api/faculties";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_LABELS = {
  Monday: "Pazartesi",
  Tuesday: "Salı",
  Wednesday: "Çarşamba",
  Thursday: "Perşembe",
  Friday: "Cuma",
};

const fieldLabel = "block text-sm font-medium text-slate-700 mb-1";
const inputBase =
  "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
const inputOk = "border-slate-300 focus:border-violet-500";
const inputError = "border-red-400 focus:border-red-500 focus:ring-red-400";

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-red-600 mt-1">
      {message}
    </p>
  );
}

function CourseManagement() {
  const [role, setRole] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
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
  const [courseFieldErrors, setCourseFieldErrors] = useState({});

  const [sectionCourseId, setSectionCourseId] = useState("");
  const [sectionFacultyId, setSectionFacultyId] = useState("");
  const [sectionCode, setSectionCode] = useState("");
  const [sectionSemester, setSectionSemester] = useState("");
  const [sectionCapacity, setSectionCapacity] = useState("");
  const [sectionClassroom, setSectionClassroom] = useState("");
  const [sectionDay, setSectionDay] = useState("Monday");
  const [sectionStartTime, setSectionStartTime] = useState("09:00:00");
  const [sectionEndTime, setSectionEndTime] = useState("10:30:00");
  const [creatingSection, setCreatingSection] = useState(false);
  const [sectionFieldErrors, setSectionFieldErrors] = useState({});

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

      const [coursesRes, departmentsRes, facultiesRes, sectionsRes] = await Promise.all([
        getAllCourses(),
        getAllDepartments(),
        getAllFaculties(),
        getAllCourseSections(),
      ]);
      setCourses(coursesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setFaculties(facultiesRes.data || []);
      setSections(
        Array.isArray(sectionsRes.data)
          ? sectionsRes.data
          : sectionsRes.data?.sections || []
      );

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

  const validateCourseForm = () => {
    const errors = {};
    if (!courseCode.trim()) errors.courseCode = "Ders kodu zorunludur.";
    if (!courseName.trim()) errors.courseName = "Ders adı zorunludur.";
    if (!credit || Number(credit) < 1)
      errors.credit = "Kredi 1 veya daha büyük olmalıdır.";
    if (!departmentId) errors.departmentId = "Bölüm seçilmelidir.";
    if (!facultyId) errors.facultyId = "Öğretim üyesi seçilmelidir.";
    if (!semester) errors.semester = "Dönem seçilmelidir.";
    if (!year || Number(year) < 2000)
      errors.year = "Geçerli bir yıl giriniz (2000 ve üzeri).";
    return errors;
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const errors = validateCourseForm();
    setCourseFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Lütfen formdaki hataları düzeltin.");
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
      setCourseFieldErrors({});
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

  const handleDeleteCourse = async (id, courseLabel) => {
    if (!window.confirm(`"${courseLabel}" dersini silmek istediğinize emin misiniz?`)) {
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

  const validateSectionForm = () => {
    const errors = {};
    if (!sectionCourseId) errors.sectionCourseId = "Ders seçilmelidir.";
    if (!sectionFacultyId) errors.sectionFacultyId = "Öğretim üyesi seçilmelidir.";
    if (!sectionCode.trim()) errors.sectionCode = "Şube kodu zorunludur.";
    if (!sectionSemester) errors.sectionSemester = "Dönem seçilmelidir.";
    if (!sectionCapacity || Number(sectionCapacity) < 1)
      errors.sectionCapacity = "Kapasite 1 veya daha büyük olmalıdır.";
    if (!sectionClassroom.trim()) errors.sectionClassroom = "Derslik zorunludur.";
    if (!sectionDay) errors.sectionDay = "Gün seçilmelidir.";
    if (!sectionStartTime) errors.sectionStartTime = "Başlangıç saati zorunludur.";
    if (!sectionEndTime) errors.sectionEndTime = "Bitiş saati zorunludur.";
    if (
      sectionStartTime &&
      sectionEndTime &&
      sectionStartTime >= sectionEndTime
    ) {
      errors.sectionEndTime = "Bitiş saati başlangıçtan sonra olmalıdır.";
    }
    return errors;
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const errors = validateSectionForm();
    setSectionFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Lütfen şube formundaki hataları düzeltin.");
      return;
    }

    setCreatingSection(true);
    try {
      await createCourseSection({
        courseId: Number(sectionCourseId),
        facultyId: Number(sectionFacultyId),
        sectionCode,
        semester: sectionSemester,
        capacity: Number(sectionCapacity),
        classroom: sectionClassroom,
        dayOfWeek: sectionDay,
        startTime: sectionStartTime,
        endTime: sectionEndTime,
      });

      setMessage(
        "Ders şubesi eklendi. Gün/saat, program oluşturulduğunda otomatik olarak yeniden atanacaktır."
      );
      setSectionCourseId("");
      setSectionFacultyId("");
      setSectionCode("");
      setSectionSemester("");
      setSectionCapacity("");
      setSectionClassroom("");
      setSectionDay("Monday");
      setSectionStartTime("09:00:00");
      setSectionEndTime("10:30:00");
      setSectionFieldErrors({});
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Şube eklenirken bir hata oluştu."
      );
    } finally {
      setCreatingSection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-medium" role="status" aria-live="polite">
          Yükleniyor...
        </p>
      </div>
    );
  }

  if (role !== "Admin" && role !== "Faculty") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium" role="alert">
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
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4"
          >
            {error}
          </div>
        )}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-lg mb-4"
          >
            {message}
          </div>
        )}

        {/* Ders Ekleme Formu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-slate-900 mb-4" id="add-course-heading">
            Yeni Ders Ekle
          </h2>

          <form
            onSubmit={handleCreateCourse}
            className="grid md:grid-cols-2 gap-4"
            noValidate
            aria-labelledby="add-course-heading"
          >
            <div>
              <label htmlFor="courseCode" className={fieldLabel}>
                Ders Kodu
              </label>
              <input
                id="courseCode"
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="CENG301"
                aria-invalid={!!courseFieldErrors.courseCode}
                aria-describedby={
                  courseFieldErrors.courseCode ? "courseCode-error" : undefined
                }
                className={`${inputBase} ${
                  courseFieldErrors.courseCode ? inputError : inputOk
                }`}
              />
              <FieldError id="courseCode-error" message={courseFieldErrors.courseCode} />
            </div>

            <div>
              <label htmlFor="courseName" className={fieldLabel}>
                Ders Adı
              </label>
              <input
                id="courseName"
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Yazılım Mühendisliği"
                aria-invalid={!!courseFieldErrors.courseName}
                aria-describedby={
                  courseFieldErrors.courseName ? "courseName-error" : undefined
                }
                className={`${inputBase} ${
                  courseFieldErrors.courseName ? inputError : inputOk
                }`}
              />
              <FieldError id="courseName-error" message={courseFieldErrors.courseName} />
            </div>

            <div>
              <label htmlFor="credit" className={fieldLabel}>
                Kredi
              </label>
              <input
                id="credit"
                type="number"
                min="1"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="3"
                aria-invalid={!!courseFieldErrors.credit}
                aria-describedby={courseFieldErrors.credit ? "credit-error" : undefined}
                className={`${inputBase} ${
                  courseFieldErrors.credit ? inputError : inputOk
                }`}
              />
              <FieldError id="credit-error" message={courseFieldErrors.credit} />
            </div>

            <div>
              <label htmlFor="departmentId" className={fieldLabel}>
                Bölüm
              </label>
              <select
                id="departmentId"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                aria-invalid={!!courseFieldErrors.departmentId}
                aria-describedby={
                  courseFieldErrors.departmentId ? "departmentId-error" : undefined
                }
                className={`${inputBase} bg-white ${
                  courseFieldErrors.departmentId ? inputError : inputOk
                }`}
              >
                <option value="">Seçiniz</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
              <FieldError id="departmentId-error" message={courseFieldErrors.departmentId} />
            </div>

            <div>
              <label htmlFor="facultyId" className={fieldLabel}>
                Öğretim Üyesi
              </label>
              <select
                id="facultyId"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                aria-invalid={!!courseFieldErrors.facultyId}
                aria-describedby={
                  courseFieldErrors.facultyId ? "facultyId-error" : undefined
                }
                className={`${inputBase} bg-white ${
                  courseFieldErrors.facultyId ? inputError : inputOk
                }`}
              >
                <option value="">Seçiniz</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {facultyDisplayName(f)}
                  </option>
                ))}
              </select>
              <FieldError id="facultyId-error" message={courseFieldErrors.facultyId} />
            </div>

            <div>
              <label htmlFor="semester" className={fieldLabel}>
                Dönem
              </label>
              <select
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                aria-invalid={!!courseFieldErrors.semester}
                aria-describedby={
                  courseFieldErrors.semester ? "semester-error" : undefined
                }
                className={`${inputBase} bg-white ${
                  courseFieldErrors.semester ? inputError : inputOk
                }`}
              >
                <option value="">Seçiniz</option>
                <option value="Güz">Güz</option>
                <option value="Bahar">Bahar</option>
                <option value="Yaz">Yaz</option>
              </select>
              <FieldError id="semester-error" message={courseFieldErrors.semester} />
            </div>

            <div>
              <label htmlFor="year" className={fieldLabel}>
                Yıl
              </label>
              <input
                id="year"
                type="number"
                min="2000"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                aria-invalid={!!courseFieldErrors.year}
                aria-describedby={courseFieldErrors.year ? "year-error" : undefined}
                className={`${inputBase} ${
                  courseFieldErrors.year ? inputError : inputOk
                }`}
              />
              <FieldError id="year-error" message={courseFieldErrors.year} />
            </div>

            <button
              type="submit"
              disabled={creating}
              aria-busy={creating}
              className="md:col-span-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition"
            >
              {creating ? "Ekleniyor..." : "Dersi Ekle"}
            </button>
          </form>
        </div>

        {/* Şube Ekleme Formu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-slate-900 mb-1" id="add-section-heading">
            Yeni Ders Şubesi Ekle
          </h2>
          <p className="text-slate-500 text-xs mb-4">
            Gün/saat/derslik bilgileri, "Programı Oluştur" çalıştırıldığında
            otomatik olarak yeniden atanır — burada girdiğiniz değerler
            sadece başlangıç değeridir.
          </p>

          <form
            onSubmit={handleCreateSection}
            className="grid md:grid-cols-2 gap-4"
            noValidate
            aria-labelledby="add-section-heading"
          >
            <div>
              <label htmlFor="sectionCourseId" className={fieldLabel}>
                Ders
              </label>
              <select
                id="sectionCourseId"
                value={sectionCourseId}
                onChange={(e) => setSectionCourseId(e.target.value)}
                aria-invalid={!!sectionFieldErrors.sectionCourseId}
                aria-describedby={
                  sectionFieldErrors.sectionCourseId ? "sectionCourseId-error" : undefined
                }
                className={`${inputBase} bg-white ${
                  sectionFieldErrors.sectionCourseId ? inputError : inputOk
                }`}
              >
                <option value="">Seçiniz</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.courseName}
                  </option>
                ))}
              </select>
              <FieldError id="sectionCourseId-error" message={sectionFieldErrors.sectionCourseId} />
            </div>

            <div>
              <label htmlFor="sectionFacultyId" className={fieldLabel}>
                Öğretim Üyesi
              </label>
              <select
                id="sectionFacultyId"
                value={sectionFacultyId}
                onChange={(e) => setSectionFacultyId(e.target.value)}
                aria-invalid={!!sectionFieldErrors.sectionFacultyId}
                aria-describedby={
                  sectionFieldErrors.sectionFacultyId ? "sectionFacultyId-error" : undefined
                }
                className={`${inputBase} bg-white ${
                  sectionFieldErrors.sectionFacultyId ? inputError : inputOk
                }`}
              >
                <option value="">Seçiniz</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {facultyDisplayName(f)}
                  </option>
                ))}
              </select>
              <FieldError id="sectionFacultyId-error" message={sectionFieldErrors.sectionFacultyId} />
            </div>

            <div>
              <label htmlFor="sectionCode" className={fieldLabel}>
                Şube Kodu
              </label>
              <input
                id="sectionCode"
                type="text"
                value={sectionCode}
                onChange={(e) => setSectionCode(e.target.value)}
                placeholder="CENG301-A"
                aria-invalid={!!sectionFieldErrors.sectionCode}
                aria-describedby={
                  sectionFieldErrors.sectionCode ? "sectionCode-error" : undefined
                }
                className={`${inputBase} ${
                  sectionFieldErrors.sectionCode ? inputError : inputOk
                }`}
              />
              <FieldError id="sectionCode-error" message={sectionFieldErrors.sectionCode} />
            </div>

            <div>
              <label htmlFor="sectionSemester" className={fieldLabel}>
                Dönem
              </label>
              <select
                id="sectionSemester"
                value={sectionSemester}
                onChange={(e) => setSectionSemester(e.target.value)}
                aria-invalid={!!sectionFieldErrors.sectionSemester}
                aria-describedby={
                  sectionFieldErrors.sectionSemester ? "sectionSemester-error" : undefined
                }
                className={`${inputBase} bg-white ${
                  sectionFieldErrors.sectionSemester ? inputError : inputOk
                }`}
              >
                <option value="">Seçiniz</option>
                <option value="Güz">Güz</option>
                <option value="Bahar">Bahar</option>
                <option value="Yaz">Yaz</option>
              </select>
              <FieldError id="sectionSemester-error" message={sectionFieldErrors.sectionSemester} />
            </div>

            <div>
              <label htmlFor="sectionCapacity" className={fieldLabel}>
                Kapasite
              </label>
              <input
                id="sectionCapacity"
                type="number"
                min="1"
                value={sectionCapacity}
                onChange={(e) => setSectionCapacity(e.target.value)}
                placeholder="40"
                aria-invalid={!!sectionFieldErrors.sectionCapacity}
                aria-describedby={
                  sectionFieldErrors.sectionCapacity ? "sectionCapacity-error" : undefined
                }
                className={`${inputBase} ${
                  sectionFieldErrors.sectionCapacity ? inputError : inputOk
                }`}
              />
              <FieldError id="sectionCapacity-error" message={sectionFieldErrors.sectionCapacity} />
            </div>

            <div>
              <label htmlFor="sectionClassroom" className={fieldLabel}>
                Derslik
              </label>
              <input
                id="sectionClassroom"
                type="text"
                value={sectionClassroom}
                onChange={(e) => setSectionClassroom(e.target.value)}
                placeholder="A Blok - 101"
                aria-invalid={!!sectionFieldErrors.sectionClassroom}
                aria-describedby={
                  sectionFieldErrors.sectionClassroom ? "sectionClassroom-error" : undefined
                }
                className={`${inputBase} ${
                  sectionFieldErrors.sectionClassroom ? inputError : inputOk
                }`}
              />
              <FieldError id="sectionClassroom-error" message={sectionFieldErrors.sectionClassroom} />
            </div>

            <div>
              <label htmlFor="sectionDay" className={fieldLabel}>
                Gün (başlangıç)
              </label>
              <select
                id="sectionDay"
                value={sectionDay}
                onChange={(e) => setSectionDay(e.target.value)}
                aria-invalid={!!sectionFieldErrors.sectionDay}
                aria-describedby={
                  sectionFieldErrors.sectionDay ? "sectionDay-error" : undefined
                }
                className={`${inputBase} bg-white ${
                  sectionFieldErrors.sectionDay ? inputError : inputOk
                }`}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d]}
                  </option>
                ))}
              </select>
              <FieldError id="sectionDay-error" message={sectionFieldErrors.sectionDay} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sectionStartTime" className={fieldLabel}>
                  Başlangıç Saati
                </label>
                <input
                  id="sectionStartTime"
                  type="time"
                  step="1"
                  value={sectionStartTime}
                  onChange={(e) => setSectionStartTime(e.target.value)}
                  aria-invalid={!!sectionFieldErrors.sectionStartTime}
                  aria-describedby={
                    sectionFieldErrors.sectionStartTime
                      ? "sectionStartTime-error"
                      : undefined
                  }
                  className={`${inputBase} ${
                    sectionFieldErrors.sectionStartTime ? inputError : inputOk
                  }`}
                />
                <FieldError
                  id="sectionStartTime-error"
                  message={sectionFieldErrors.sectionStartTime}
                />
              </div>
              <div>
                <label htmlFor="sectionEndTime" className={fieldLabel}>
                  Bitiş Saati
                </label>
                <input
                  id="sectionEndTime"
                  type="time"
                  step="1"
                  value={sectionEndTime}
                  onChange={(e) => setSectionEndTime(e.target.value)}
                  aria-invalid={!!sectionFieldErrors.sectionEndTime}
                  aria-describedby={
                    sectionFieldErrors.sectionEndTime ? "sectionEndTime-error" : undefined
                  }
                  className={`${inputBase} ${
                    sectionFieldErrors.sectionEndTime ? inputError : inputOk
                  }`}
                />
                <FieldError
                  id="sectionEndTime-error"
                  message={sectionFieldErrors.sectionEndTime}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingSection}
              aria-busy={creatingSection}
              className="md:col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition"
            >
              {creatingSection ? "Ekleniyor..." : "Şubeyi Ekle"}
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
            <ul className="divide-y divide-slate-100">
              {courses.map((course) => {
                const label = `${course.courseCode} — ${course.courseName}`;
                return (
                  <li
                    key={course.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {course.credit ?? "—"} kredi
                        {course.department?.name
                          ? ` · ${course.department.name}`
                          : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCourse(course.id, label)}
                      disabled={deletingId === course.id}
                      aria-label={`${label} dersini sil`}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      {deletingId === course.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseManagement;