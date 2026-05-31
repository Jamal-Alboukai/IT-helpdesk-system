import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Protected routes — backend enforces role access */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="flex items-center justify-center h-screen bg-gray-900">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/tickets" element={
            <ProtectedRoute>
              <div className="flex items-center justify-center h-screen bg-gray-900">
                <h1 className="text-3xl font-bold text-white">Tickets</h1>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <div className="flex items-center justify-center h-screen bg-gray-900">
                <h1 className="text-3xl font-bold text-white">Reports</h1>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <div className="flex items-center justify-center h-screen bg-gray-900">
                <h1 className="text-3xl font-bold text-white">User Management</h1>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <div className="flex items-center justify-center h-screen bg-gray-900">
                <h1 className="text-3xl font-bold text-white">Settings</h1>
              </div>
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;