import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

// Sayfalar artık lazy-load ediliyor — her biri ayrı bir JS chunk'ı olarak
// derlenir ve sadece o route ziyaret edildiğinde indirilir. Bu, tek parça
// 1.7MB'lık bundle'ı küçük parçalara bölerek ilk yükleme süresini kısaltır.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Courses = lazy(() => import("./pages/Courses"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Grades = lazy(() => import("./pages/Grades"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Events = lazy(() => import("./pages/Events"));
const Meals = lazy(() => import("./pages/Meals"));
const Gradebook = lazy(() => import("./pages/Gradebook"));
const MyCourses = lazy(() => import("./pages/MyCourses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const MyAttendance = lazy(() => import("./pages/MyAttendance"));
const AttendanceStart = lazy(() => import("./pages/AttendanceStart"));
const AttendanceGive = lazy(() => import("./pages/AttendanceGive"));
const AttendanceReport = lazy(() => import("./pages/AttendanceReport"));
const ExcuseRequests = lazy(() => import("./pages/ExcuseRequests"));
const Scheduling = lazy(() => import("./pages/Scheduling"));
const Payments = lazy(() => import("./pages/Payments"));
const CourseManagement = lazy(() => import("./pages/CourseManagement"));
const Reservations = lazy(() => import("./pages/Reservations"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAcademicAnalytics = lazy(() => import("./pages/AdminAcademicAnalytics"));
const AdminAttendanceAnalytics = lazy(() => import("./pages/AdminAttendanceAnalytics"));
const AdminEventAnalytics = lazy(() => import("./pages/AdminEventAnalytics"));
const AdminMealAnalytics = lazy(() => import("./pages/AdminMealAnalytics"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400 font-medium" role="status" aria-live="polite">
        Yükleniyor...
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/attendance/give/:sessionId"
            element={
              <ProtectedRoute>
                <AttendanceGive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/excuse-requests"
            element={
              <ProtectedRoute>
                <ExcuseRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meals"
            element={
              <ProtectedRoute>
                <Meals />
              </ProtectedRoute>
            }
          />

          <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
          <Route
            path="/attendance/report/:sectionId"
            element={
              <ProtectedRoute>
                <AttendanceReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics/events"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminEventAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance/start"
            element={
              <ProtectedRoute>
                <AttendanceStart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics/academic"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminAcademicAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gradebook/:sectionId"
            element={
              <ProtectedRoute>
                <Gradebook />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course-management"
            element={
              <ProtectedRoute>
                <CourseManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-attendance"
            element={
              <ProtectedRoute>
                <MyAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/grades"
            element={
              <ProtectedRoute>
                <Grades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics/attendance"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminAttendanceAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics/meal"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminMealAnalytics />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;