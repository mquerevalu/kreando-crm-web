import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkflowStore } from '../store/workflowStore';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { workflows, fetchWorkflows, createWorkflow, deleteWorkflow } = useWorkflowStore();
  const [showDialog, setShowDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      fetchWorkflows(user.companyId);
    }
  }, [user?.companyId, fetchWorkflows]);

  const handleCreateWorkflow = async () => {
    if (!user?.companyId || !newWorkflowName) return;

    try {
      const workflow = await createWorkflow(user.companyId, newWorkflowName, newWorkflowDesc);
      navigate(`/workflows/${workflow.id}`);
      setShowDialog(false);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este flujo?')) {
      await deleteWorkflow(id);
    }
  };

  const activeCount = workflows.filter((w) => w.active).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido, <span className="font-semibold">{user?.name}</span>. Empresa: {user?.companyId}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{workflows.length}</div>
          <div className="text-gray-600 text-sm mt-1">Flujos Totales</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{activeCount}</div>
          <div className="text-gray-600 text-sm mt-1">Flujos Activos</div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mis Flujos</h2>
        <button
          onClick={() => setShowDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nuevo Flujo
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No tienes flujos creados. ¡Crea uno para comenzar!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                <p className="text-gray-600 text-sm mt-2">{workflow.description}</p>
                <div className="mt-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    workflow.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {workflow.active ? '✓ Activo' : '✗ Inactivo'}
                  </span>
                </div>
              </div>
              <div className="border-t px-6 py-4 flex gap-2">
                <button
                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                  className="flex-1 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 transition text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                  className="flex-1 bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 transition text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crear Nuevo Flujo</h3>
            <input
              type="text"
              placeholder="Nombre del Flujo"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Descripción"
              value={newWorkflowDesc}
              onChange={(e) => setNewWorkflowDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
