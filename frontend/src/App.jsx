// src/App.jsx
import { Routes, Route, Outlet } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './utils/PrivateRoute';
import PublicRoute from './utils/PublicRoute';
import Header from './components/Header';
import SocialAuthCallback from './pages/SocialAuthCallback';

// This is the updated layout
const ProtectedLayout = () => {
    return (
        // Use flexbox to control the layout
        <div className="flex flex-col h-screen bg-dark-bg">
            <Header />
            {/* This div will grow to fill the remaining space */}
            <div className="flex-1 overflow-hidden">
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
        <Route path="/social-auth-callback/" element={<SocialAuthCallback />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;