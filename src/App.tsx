import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkflowBuilderPage from './pages/WorkflowBuilderPage';
import ConversationsPage from './pages/ConversationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/workflows" element={<WorkflowBuilderPage />} />
                    <Route path="/workflows/:id" element={<WorkflowBuilderPage />} />
                    <Route path="/conversations" element={<ConversationsPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
