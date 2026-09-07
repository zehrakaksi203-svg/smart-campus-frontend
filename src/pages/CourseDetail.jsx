import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import {
  getCourseById,
  getPrerequisitesByCourse,
  getAllCourseSections,
} from "../api/courses";
import { getMyEnrollments, createEnrollment } from "../api/enrollments";

function CourseDetail() {
  const { id } = useParams();
  const [role, setRole] = useState(null);
  const [course, setCourse] = useState(null);
  const [prerequisites, setPrerequisites] = useState([]);
  const [sections, setSections] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [enrollingId, setEnrollingId] = useState(null);
  const [pendingSection, setPendingSection] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const meRes = await api.get("/users/me");
      setRole(meRes.data.role);

      const [courseRes, prereqRes, sectionsRes] = await Promise.all([
        getCourseById(id),
        getPrerequisitesByCourse(id),
        getAllCourseSections(),
      ]);

      setCourse(courseRes.data);
      setPrerequisites(prereqRes.data);
      setSections(sectionsRes.data.filter((s) => s.courseId === Number(id)));

      if (meRes.data.role === "Student") {
        const myRes = await getMyEnrollments();
        setMyCourses(myRes.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Ders bilgileri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isEnrolled = (sectionId) =>
    myCourses.some((e) => e.sectionId === sectionId || e.section?.id === sectionId);

  const confirmEnroll = async () => {
    if (!pendingSection) return;
    const sectionId = pendingSection.id;
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
      setPendingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Ders bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link to="/courses" className="text-blue-600 font-medium hover:underline">
        ← Derslere dön
      </Link>

      <div className="bg-white rounded-xl shadow p-6 mt-4 mb-6">
        <h1 className="text-3xl font-bold mb-1">{course.courseName}</h1>
        <p className="text-gray-500 mb-4">{course.courseCode}</p>

        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
          <p><strong>Kredi:</strong> {course.credit}</p>
          <p><strong>Dönem:</strong> {course.semester}</p>
          <p><strong>Yıl:</strong> {course.year}</p>
        </div>

        {course.description && (
          <p className="text-gray-700">{course.description}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-100 text-green-700 text-sm p-3 rounded mb-4">
          {message}
        </div>
      )}

      {prerequisites.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-3">Önkoşullar</h2>
          <div className="flex flex-wrap gap-2">
            {prerequisites.map((p) => (
              <Link
                key={p.id}
                to={`/courses/${p.prerequisiteCourseId}`}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-sm font-medium"
              >
                {p.prerequisiteCourse?.courseCode || `Ders #${p.prerequisiteCourseId}`}
                {p.prerequisiteCourse?.courseName ? ` — ${p.prerequisiteCourse.courseName}` : ""}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">Açık Şubeler</h2>

        {sections.length === 0 && (
          <p className="text-gray-500">Bu ders için açık şube bulunmuyor.</p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold">Şube {section.sectionCode}</p>
              <p className="text-sm text-gray-600 mt-1">
                {section.dayOfWeek} · {section.startTime}–{section.endTime}
              </p>
              <p className="text-sm text-gray-600">
                Derslik: {section.classroom}
              </p>
              <p className="text-sm text-gray-600">
                Kontenjan: {section.enrolledCount}/{section.capacity}
              </p>

              {role === "Student" && (
                <button
                  onClick={() => setPendingSection(section)}
                  disabled={isEnrolled(section.id) || enrollingId === section.id}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isEnrolled(section.id)
                    ? "Kayıtlısın"
                    : enrollingId === section.id
                    ? "Kaydediliyor..."
                    : "Kayıt Ol"}
                </button>
              )}

              {role === "Faculty" && (
                <Link
                  to={`/gradebook/${section.id}`}
                  className="mt-3 block text-center bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700"
                >
                  Not Gir
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {pendingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Kayıt Onayı</h3>
            <p className="text-gray-600 mb-1">
              <strong>{course.courseName}</strong> ({course.courseCode})
            </p>
            <p className="text-gray-600 mb-4">
              Şube {pendingSection.sectionCode} — {pendingSection.dayOfWeek}{" "}
              {pendingSection.startTime}–{pendingSection.endTime}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Bu derse kayıt olmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingSection(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-semibold hover:bg-gray-300"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmEnroll}
                disabled={enrollingId === pendingSection.id}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {enrollingId === pendingSection.id ? "Kaydediliyor..." : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;