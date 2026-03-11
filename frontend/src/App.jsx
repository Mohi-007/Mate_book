import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import DebatesPage from './pages/DebatesPage';
import ChallengesPage from './pages/ChallengesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FriendsPage from './pages/FriendsPage';
import NewsPage from './pages/NewsPage';
import SavedPage from './pages/SavedPage';
import SettingsPage from './pages/SettingsPage';
import PersonaPage from './pages/PersonaPage';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-container">
        <div className="loader"><div className="loader-spinner" /></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-container">
        <div className="loader"><div className="loader-spinner" /></div>
      </div>
    );
  }
  if (user) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/debates" element={<ProtectedRoute><DebatesPage /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><NewsPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/persona" element={<ProtectedRoute><PersonaPage /></ProtectedRoute>} />
        {/* Redirect old /admin to /settings */}
        <Route path="/admin" element={<Navigate to="/settings" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
