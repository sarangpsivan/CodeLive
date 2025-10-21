// src/App.jsx
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

const ProtectedLayout = () => {
    return (
        // This flexbox layout is the key to the full-height sidebar
        <div className="flex flex-col h-screen bg-dark-bg">
            <Header />
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    )
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
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
        </Route>
        <Route path="/project/:projectId/editor" element={<EditorPage />} />
        <Route path="/project/:projectId/documentation/:documentId" element={<DocumentationEditorPage />} />
      </Route>
    </Routes>
  );
}

export default App;