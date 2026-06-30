import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import TicketListPage from './pages/tickets/TicketListPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import EditTicketPage from './pages/tickets/EditTicketPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MainLayout from './layouts/MainLayout';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UsersPage from './pages/users/UsersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Protected routes with sidebar layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets" element={
            <ProtectedRoute>
              <MainLayout>
                <TicketListPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets/new" element={
            <ProtectedRoute>
              <MainLayout>
                <CreateTicketPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets/:id" element={
            <ProtectedRoute>
              <MainLayout>
                <TicketDetailPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets/:id/edit" element={
            <ProtectedRoute>
              <MainLayout>
                <EditTicketPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <MainLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-white">Reports</h1>
                  <p className="text-gray-400 mt-2">Coming in Week 6.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <UsersPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                  <p className="text-gray-400 mt-2">Coming in Week 7.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
              <ProtectedRoute>
                <MainLayout>
                  <NotificationsPage />
                </MainLayout>
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