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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl transition-all duration-300`}>
        <div className="p-4 border-b border-slate-700">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-white text-sm">Kreando</h1>
                <p className="text-xs text-blue-300">Agente</p>
              </div>
            )}
          </div>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700 text-gray-300 hover:text-white transition font-medium text-sm"
          >
            {sidebarOpen ? '📊 Dashboard' : '📊'}
          </button>
          <button
            onClick={() => navigate('/conversations')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700 text-gray-300 hover:text-white transition font-medium text-sm"
          >
            {sidebarOpen ? '💬 Conversaciones' : '💬'}
          </button>
          <button
            onClick={() => navigate('/companies')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700 text-gray-300 hover:text-white transition font-medium text-sm"
          >
            {sidebarOpen ? '🏢 Empresas' : '🏢'}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200">
          <div className="flex items-center justify-between px-8 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900 text-xl"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                K
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Kreando Agente
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold hover:shadow-lg transition"
                >
                  {user?.name.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm"
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
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
