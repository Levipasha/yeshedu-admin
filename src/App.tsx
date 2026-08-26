import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { StudentsManagement } from './pages/StudentsManagement';
import { ParentsManagement } from './pages/ParentsManagement';
import { CoursesManagement } from './pages/CoursesManagement';
import { BlogsManagement } from './pages/BlogsManagement';
import { QueriesManagement } from './pages/QueriesManagement';
import { AttendanceManagement } from './pages/AttendanceManagement';
import { AcademicsManagement } from './pages/AcademicsManagement';
import { FeesManagement } from './pages/FeesManagement';
import { TeacherMessagesManagement } from './pages/TeacherMessagesManagement';
import { AssignmentsManagement } from './pages/AssignmentsManagement';
import { PracticeTestsManagement } from './pages/PracticeTestsManagement';
import { TrendingCoursesManagement } from './pages/TrendingCoursesManagement';
import { MangaLearningManagement } from './pages/MangaLearningManagement';
import { AboutUsManagement } from './pages/AboutUsManagement';
import { Login } from './pages/Login';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "students", element: <StudentsManagement /> },
      { path: "parents", element: <ParentsManagement /> },
      { path: "attendance", element: <AttendanceManagement /> },
      { path: "academics", element: <AcademicsManagement /> },
      { path: "assignments", element: <AssignmentsManagement /> },
      { path: "practice-tests", element: <PracticeTestsManagement /> },
      { path: "fees", element: <FeesManagement /> },
      { path: "messages", element: <TeacherMessagesManagement /> },
      { path: "courses", element: <CoursesManagement /> },
      { path: "trending-courses", element: <TrendingCoursesManagement /> },
      { path: "home-learning", element: <MangaLearningManagement /> },
      { path: "blogs", element: <BlogsManagement /> },
      { path: "about-us", element: <AboutUsManagement /> },
      { path: "queries", element: <QueriesManagement /> },
      { path: "*", element: <Navigate to="/" replace /> }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
