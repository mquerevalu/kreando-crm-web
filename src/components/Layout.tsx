import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300`}>
        <div className="p-4 border-b">
          <h1 className={`font-bold text-lg ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'Vectia' : 'V'}
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-left px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition"
          >
            {sidebarOpen ? '📊 Dashboard' : '📊'}
          </button>
          <button
            onClick={() => navigate('/workflows')}
            className="w-full text-left px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition"
          >
            {sidebarOpen ? '⚙️ Flujos' : '⚙️'}
          </button>
          <button
            onClick={() => navigate('/conversations')}
            className="w-full text-left px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition"
          >
            {sidebarOpen ? '💬 Conversaciones' : '💬'}
          </button>
          <button
            onClick={() => navigate('/companies')}
            className="w-full text-left px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition"
          >
            {sidebarOpen ? '🏢 Empresas' : '🏢'}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              ☰
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Vectia Workflow</h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold"
                >
                  {user?.name.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
