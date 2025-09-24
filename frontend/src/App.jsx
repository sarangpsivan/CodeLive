// src/App.jsx
import { Routes, Route, Outlet } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage'; // Make sure this is imported
import PrivateRoute from './utils/PrivateRoute';
import PublicRoute from './utils/PublicRoute';
import Header from './components/Header';

const ProtectedLayout = () => {
    return (
        <div className="bg-dark-bg min-h-screen">
            <Header />
            <Outlet />
        </div>
    )
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route path="/project/:projectId/editor" element={<EditorPage />} />
      </Route>
    </Routes>
  );
}

export default App;