import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import Meals from "./pages/Meals";
import Gradebook from "./pages/Gradebook";
import MyCourses from "./pages/MyCourses";
import CourseDetail from "./pages/CourseDetail";
import MyAttendance from "./pages/MyAttendance";
import AttendanceStart from "./pages/AttendanceStart";
import AttendanceGive from "./pages/AttendanceGive";
import AttendanceReport from "./pages/AttendanceReport";
import ExcuseRequests from "./pages/ExcuseRequests";
import Scheduling from "./pages/Scheduling";
import Payments from "./pages/Payments";
import CourseManagement from "./pages/CourseManagement";
// ...


function App() {
  return (
    <BrowserRouter>
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
  path="/meals"
  element={
    <ProtectedRoute>
      <Meals />
    </ProtectedRoute>
  }
/>

<Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
<Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />

<Route
  path="/attendance/report/:sectionId"
  element={
    <ProtectedRoute>
      <AttendanceReport />
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
  path="/events"
  element={
    <ProtectedRoute>
      <Events />
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
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;
