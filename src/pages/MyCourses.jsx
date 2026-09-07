import { useEffect, useState } from "react";
import { getMyEnrollments, deleteEnrollment } from "../api/enrollments";
import { getMyAttendance } from "../api/attendanceSession";

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [attendanceByCourse, setAttendanceByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [droppingId, setDroppingId] = useState(null);

  const loadCourses = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getMyEnrollments();
      setCourses(res.data);

      try {
        const attRes = await getMyAttendance();
        const map = {};
        (attRes.data || []).forEach((item) => {
          map[item.courseId] = item;
        });
        setAttendanceByCourse(map);
      } catch (attErr) {
        console.error("Yoklama verisi yüklenemedi:", attErr);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Kayıtlı dersler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDrop = async (enrollmentId, courseName) => {
    const confirmed = window.confirm(
      `"${courseName}" dersinden çıkmak istediğinize emin misiniz?`
    );

    if (!confirmed) return;

    setDroppingId(enrollmentId);
    setError("");
    setMessage("");

    try {
      await deleteEnrollment(enrollmentId);

      setMessage("Ders kaydı başarıyla silindi.");
      await loadCourses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Ders kaydı silinirken bir hata oluştu."
      );
    } finally {
      setDroppingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">📚 Derslerim</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {message}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">
            Henüz kayıtlı olduğunuz bir ders bulunmuyor.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((enrollment) => {
            const section = enrollment.section;
            const course = enrollment.course || section?.course;

            const courseName = course?.courseName || "Ders";
            const courseCode = course?.courseCode || "—";

            const attendance = course?.id
              ? attendanceByCourse[course.id]
              : null;

            let attendanceBadge = null;
            if (attendance) {
              const badgeClass =
                attendance.status === "Critical"
                  ? "bg-red-100 text-red-700"
                  : attendance.status === "Warning"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";

              attendanceBadge = (
                <span
                  className={`inline-block text-xs font-semibold px-2 py-1 rounded ml-2 ${badgeClass}`}
                >
                  {attendance.status === "Critical"
                    ? "Kritik"
                    : attendance.status === "Warning"
                    ? "Uyarı"
                    : "İyi"}
                </span>
              );
            }

            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl shadow p-5"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">
                      {courseCode}
                    </p>

                    <h2 className="text-xl font-bold mt-1">
                      {courseName}
                    </h2>
                  </div>

                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                    {enrollment.status || "Active"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Section:</strong>{" "}
                    {section?.sectionCode || section?.id || "—"}
                  </p>

                  <p>
                    <strong>Dönem:</strong>{" "}
                    {enrollment.semester || section?.semester || "—"}
                  </p>

                  <p>
                    <strong>Akademik Yıl:</strong>{" "}
                    {enrollment.academicYear || "—"}
                  </p>

                  <p>
                    <strong>Kapasite:</strong>{" "}
                    {section?.enrolledCount ?? "—"} /{" "}
                    {section?.capacity ?? "—"}
                  </p>

                  <p>
                    <strong>Sınıf:</strong>{" "}
                    {section?.classroom || "—"}
                  </p>

                  <p>
                    <strong>Gün:</strong>{" "}
                    {section?.dayOfWeek || "—"}
                  </p>

                  <p>
                    <strong>Saat:</strong>{" "}
                    {section?.startTime && section?.endTime
                      ? `${section.startTime} - ${section.endTime}`
                      : "—"}
                  </p>
                </div>

                <div className="mt-5 border-t pt-4">
                  <p className="text-sm text-gray-600 flex items-center flex-wrap">
                    <strong>Yoklama:</strong>{" "}
                    {attendance
                      ? `%${attendance.attendanceRate} (${attendance.attendedSessions}/${attendance.totalSessions})`
                      : "Henüz veri yok"}
                    {attendanceBadge}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleDrop(enrollment.id, courseName)
                  }
                  disabled={droppingId === enrollment.id}
                  className="mt-5 w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {droppingId === enrollment.id
                    ? "Çıkarılıyor..."
                    : "Dersten Çık"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyCourses;
