import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { companyService } from '../services/companyService';

interface Company {
  configId: string;
  nombreEmpresa: string;
  estado: 'active' | 'inactive';
  agentActive: boolean;
  fechaCreacion: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanies();
      setCompanies(data as any);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.estado === 'active').length;
  const inactiveCompanies = companies.filter(c => c.estado === 'inactive').length;
  const agentsActive = companies.filter(c => c.agentActive).length;
  const agentsInactive = companies.filter(c => !c.agentActive).length;

  // Empresas creadas este mes
  const thisMonth = new Date();
  const companiesThisMonth = companies.filter(c => {
    const createdDate = new Date(c.fechaCreacion);
    return createdDate.getMonth() === thisMonth.getMonth() && 
           createdDate.getFullYear() === thisMonth.getFullYear();
  }).length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Bienvenido, <span className="font-semibold text-gray-900">{user?.name}</span>
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Empresas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Empresas</p>
              <div className="text-4xl font-bold text-blue-600 mt-2">{totalCompanies}</div>
            </div>
            <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center text-3xl">
              🏢
            </div>
          </div>
        </div>

        {/* Empresas Activas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Empresas Activas</p>
              <div className="text-4xl font-bold text-green-600 mt-2">{activeCompanies}</div>
              <p className="text-xs text-gray-500 mt-1">{inactiveCompanies} inactivas</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center text-3xl">
              ✓
            </div>
          </div>
        </div>

        {/* Agentes Activos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Agentes Activos</p>
              <div className="text-4xl font-bold text-purple-600 mt-2">{agentsActive}</div>
              <p className="text-xs text-gray-500 mt-1">{agentsInactive} inactivos</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center text-3xl">
              🤖
            </div>
          </div>
        </div>

        {/* Empresas Este Mes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Nuevas Este Mes</p>
              <div className="text-4xl font-bold text-orange-600 mt-2">{companiesThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">{thisMonth.toLocaleString('es-ES', { month: 'long' })}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center text-3xl">
              📈
            </div>
          </div>
        </div>
      </div>

      {/* Empresas List */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Empresas Registradas</h2>
        
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Cargando empresas...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-gray-600 text-lg">No hay empresas registradas</p>
            <p className="text-gray-500 text-sm mt-2">Las empresas aparecerán aquí cuando se registren</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div key={company.configId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {company.nombreEmpresa.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        company.estado === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {company.estado === 'active' ? '● Activa' : '● Inactiva'}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        company.agentActive
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {company.agentActive ? '🤖 Agente' : '⏸️ Sin Agente'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{company.nombreEmpresa}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>ID: <span className="font-mono text-xs text-gray-500">{company.configId}</span></p>
                    <p>Creada: <span className="font-medium">{new Date(company.fechaCreacion).toLocaleDateString('es-ES')}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
