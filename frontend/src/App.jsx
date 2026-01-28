import { Routes, Route, Outlet } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import PrivateRoute from './utils/PrivateRoute';
import PublicRoute from './utils/PublicRoute';
import Header from './components/Header';
import SocialAuthCallback from './pages/SocialAuthCallback';
import ProjectDetailPage from './pages/ProjectDetailPage';
import JoinPage from './pages/JoinPage';
import DocumentationEditorPage from './pages/DocumentationEditorPage';
import ProfilePage from './pages/ProfilePage';

import DashboardLayout from './components/layout/DashboardLayout';

const ProtectedLayout = () => {
  return <DashboardLayout />;
}

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/social-auth-callback" element={<SocialAuthCallback />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
        </Route>
        <Route path="/project/:projectId/editor" element={<EditorPage />} />
        <Route path="/project/:projectId/documentation/:documentId" element={<DocumentationEditorPage />} />
      </Route>
    </Routes>
  );
}

export default App;