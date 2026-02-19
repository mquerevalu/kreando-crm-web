import React, { useEffect, useState, useCallback } from 'react';
import { companyService, Company } from '../services/companyService';
import CompanyFlowBuilder from '../components/CompanyFlowBuilder';
import FlowBuilderModal from '../components/FlowBuilderModal';
import { KnowledgeBaseUploadModal } from '../components/KnowledgeBaseUploadModal';

interface FlowStep {
  stepId: string;
  fieldName: string;
  question: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select';
  validation: {
    required: boolean;
    type: string;
  };
  errorMessage?: string;
  options?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  dependsOn?: string;
  showWhen?: string;
}

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'flow'>('info');
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (err) {
      setError('Error al cargar las empresas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditingCompany({ ...company });
    setFlowSteps((company as any).flujoBot || []);
    setActiveTab('info');
    setError(null);
    setSuccessMessage(null);
  };

  const handleInputChange = (field: keyof Company, value: any) => {
    if (editingCompany) {
      setEditingCompany({
        ...editingCompany,
        [field]: value,
      });
    }
  };

  const handleAddStep = (step: FlowStep) => {
    setFlowSteps([...flowSteps, step]);
  };

  const handleUpdateStep = (stepId: string, updatedStep: FlowStep) => {
    setFlowSteps(flowSteps.map(s => s.stepId === stepId ? updatedStep : s));
  };

  const handleDeleteStep = (stepId: string) => {
    setFlowSteps(flowSteps.filter(s => s.stepId !== stepId));
  };

  const handleSave = async () => {
    if (!selectedCompany || !editingCompany) return;

    try {
      setLoading(true);
      setError(null);

      // Preparar datos para actualizar (excluir campos no editables)
      const updateData: Partial<Company> = {
        nombreEmpresa: editingCompany.nombreEmpresa,
        accessToken: editingCompany.accessToken,
        agentActive: editingCompany.agentActive,
        estado: editingCompany.estado,
        prompt: editingCompany.prompt,
        urlWebHook: editingCompany.urlWebHook,
        phoneNumberId: editingCompany.phoneNumberId,
        wspNumberId: editingCompany.wspNumberId,
        accountId: editingCompany.accountId,
        ...(activeTab === 'flow' && { flujoBot: flowSteps as any }),
      };

      const updated = await companyService.updateCompany(selectedCompany.configId, updateData);
      
      // Actualizar la lista
      setCompanies(prev =>
        prev.map(c => c.configId === updated.configId ? updated : c)
      );
      
      setSelectedCompany(updated);
      setEditingCompany(updated);
      setFlowSteps((updated as any).flujoBot || []);
      setSuccessMessage('Empresa actualizada correctamente');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Error al actualizar la empresa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (selectedCompany) {
      setEditingCompany({ ...selectedCompany });
      setFlowSteps((selectedCompany as any).flujoBot || []);
    }
  };

  return (
    <div className="flex h-full bg-gray-100">
      {/* Companies List */}
      <div className="w-80 bg-white flex flex-col border-r border-gray-200 shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
          <h1 className="text-2xl font-bold">🏢 Empresas</h1>
          <p className="text-slate-300 text-sm mt-1">Gestión de empresas</p>
        </div>

        {/* Companies List */}
        <div className="flex-1 overflow-y-auto">
          {loading && companies.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Cargando...</div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🏢</div>
              <p>No hay empresas</p>
            </div>
          ) : (
            companies.map((company) => (
              <button
                key={company.configId}
                onClick={() => handleSelectCompany(company)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selectedCompany?.configId === company.configId ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {company.nombreEmpresa.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{company.nombreEmpresa}</p>
                    <p className="text-xs text-gray-500 truncate">{company.phoneNumberId}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    company.estado === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {company.estado === 'active' ? 'Activa' : 'Inactiva'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Company Details */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedCompany && editingCompany ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 shadow-md">
              <h2 className="text-3xl font-bold">{selectedCompany.nombreEmpresa}</h2>
              <p className="text-slate-300 text-sm mt-2">ID: {selectedCompany.configId}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white shadow-sm">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-8 py-4 font-semibold text-sm transition ${
                  activeTab === 'info'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ℹ️ Información
              </button>
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-8 py-4 font-semibold text-sm transition ${
                  activeTab === 'flow'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔄 Flujo Bot
              </button>
              <button
                onClick={() => setShowFlowModal(true)}
                className="px-8 py-4 font-semibold text-sm text-blue-600 hover:text-blue-800 transition flex items-center gap-2 ml-auto"
                title="Abrir editor de flujo en pantalla completa"
              >
                🖥️ Pantalla Completa
              </button>
              <button
                onClick={() => setShowKnowledgeBaseModal(true)}
                className="px-8 py-4 font-semibold text-sm text-green-600 hover:text-green-800 transition flex items-center gap-2"
                title="Subir base de conocimiento desde Excel"
              >
                📊 Subir Excel a Pinecone
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                {successMessage}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              {activeTab === 'info' ? (
                <div className="space-y-6">
                  {/* Nombre Empresa */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Empresa</label>
                    <input
                      type="text"
                      value={editingCompany.nombreEmpresa || ''}
                      onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Access Token */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Access Token</label>
                    <textarea
                      value={editingCompany.accessToken || ''}
                      onChange={(e) => handleInputChange('accessToken', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>

                  {/* Agent Active */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingCompany.agentActive || false}
                        onChange={(e) => handleInputChange('agentActive', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">Agente Activo</span>
                    </label>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                    <select
                      value={editingCompany.estado || 'active'}
                      onChange={(e) => handleInputChange('estado', e.target.value as 'active' | 'inactive')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prompt del Agente</label>
                    <textarea
                      value={editingCompany.prompt || ''}
                      onChange={(e) => handleInputChange('prompt', e.target.value)}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* URL WebHook */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">URL WebHook</label>
                    <input
                      type="text"
                      value={editingCompany.urlWebHook || ''}
                      onChange={(e) => handleInputChange('urlWebHook', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone Number ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number ID</label>
                    <input
                      type="text"
                      value={editingCompany.phoneNumberId || ''}
                      onChange={(e) => handleInputChange('phoneNumberId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* WSP Number ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">WSP Number ID</label>
                    <input
                      type="text"
                      value={editingCompany.wspNumberId || ''}
                      onChange={(e) => handleInputChange('wspNumberId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Account ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account ID</label>
                    <input
                      type="text"
                      value={editingCompany.accountId || ''}
                      onChange={(e) => handleInputChange('accountId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Read-only Fields */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Información de Solo Lectura</p>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de Creación</label>
                      <input
                        type="text"
                        value={new Date(selectedCompany.fechaCreacion).toLocaleString('es-ES')}
                        disabled
                        className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded text-sm text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Última Actualización</label>
                      <input
                        type="text"
                        value={new Date(selectedCompany.fechaActualizacion).toLocaleString('es-ES')}
                        disabled
                        className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded text-sm text-gray-600"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <CompanyFlowBuilder
                    flowSteps={flowSteps}
                    onAddStep={handleAddStep}
                    onUpdateStep={handleUpdateStep}
                    onDeleteStep={handleDeleteStep}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-8 flex gap-3 justify-end bg-white shadow-md">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-lg">Selecciona una empresa</p>
              <p className="text-sm mt-2">para ver y editar sus detalles</p>
            </div>
          </div>
        )}
      </div>

      {/* Flow Builder Modal */}
      {selectedCompany && (
        <FlowBuilderModal
          isOpen={showFlowModal}
          flowSteps={flowSteps}
          companyName={selectedCompany.nombreEmpresa}
          onAddStep={handleAddStep}
          onUpdateStep={handleUpdateStep}
          onDeleteStep={handleDeleteStep}
          onClose={() => setShowFlowModal(false)}
        />
      )}

      {/* Knowledge Base Upload Modal */}
      {selectedCompany && (
        <KnowledgeBaseUploadModal
          isOpen={showKnowledgeBaseModal}
          onClose={() => setShowKnowledgeBaseModal(false)}
          companyId={selectedCompany.configId}
          companyName={selectedCompany.nombreEmpresa}
        />
      )}
    </div>
  );
};

export default CompaniesPage;
