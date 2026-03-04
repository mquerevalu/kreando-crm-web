import React, { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { userService, User, UserRole } from '../services/userService';
import { companyService, Company } from '../services/companyService';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';

const UsersManagementPage: React.FC = () => {
  const { isAdmin } = useUserStore();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignCompanyModal, setShowAssignCompanyModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    name: '',
    role: 'asesor' as UserRole,
    password: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'asesor' as UserRole,
    password: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados para diálogos
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
      loadCompanies();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'La contraseña es requerida para crear un usuario',
        type: 'error',
      });
      return;
    }
    
    try {
      await userService.createOrUpdateUser(
        formData.userId,
        formData.email,
        formData.name,
        formData.role,
        formData.password
      );
      setShowCreateModal(false);
      setFormData({ userId: '', email: '', name: '', role: 'asesor', password: '' });
      loadUsers();
      setAlertDialog({
        isOpen: true,
        title: 'Éxito',
        message: 'Usuario creado exitosamente',
        type: 'success',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al crear usuario',
        type: 'error',
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const updates: any = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
      };
      
      if (editFormData.password) {
        updates.password = editFormData.password;
      }
      
      await userService.updateUser(selectedUser.userId, updates);
      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({ name: '', email: '', role: 'asesor', password: '' });
      loadUsers();
      setAlertDialog({
        isOpen: true,
        title: 'Éxito',
        message: 'Usuario actualizado exitosamente',
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al actualizar usuario',
        type: 'error',
      });
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await userService.updateUser(user.userId, { active: !user.active });
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleAssignCompany = async (configId: string) => {
    if (!selectedUser) return;
    try {
      await userService.assignCompany(selectedUser.userId, configId);
      loadUsers();
      setAlertDialog({
        isOpen: true,
        title: 'Éxito',
        message: 'Empresa asignada correctamente',
        type: 'success',
      });
    } catch (error) {
      console.error('Error assigning company:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al asignar empresa',
        type: 'error',
      });
    }
  };

  const handleUnassignCompany = async (userId: string, configId: string) => {
    const company = companies.find(c => c.configId === configId);
    const user = users.find(u => u.userId === userId);
    
    setConfirmDialog({
      isOpen: true,
      title: 'Desasignar empresa',
      message: `¿Desasignar la empresa "${company?.nombreEmpresa}" de ${user?.name}?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await userService.unassignCompany(userId, configId);
          loadUsers();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          setAlertDialog({
            isOpen: true,
            title: 'Éxito',
            message: 'Empresa desasignada correctamente',
            type: 'success',
          });
        } catch (error) {
          console.error('Error unassigning company:', error);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: 'Error al desasignar empresa',
            type: 'error',
          });
        }
      },
    });
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Crear Usuario
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresas Asignadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.userId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.userId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'administrador' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'operador' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {user.assignedCompanies?.map((configId) => {
                        const company = companies.find(c => c.configId === configId);
                        return (
                          <span
                            key={configId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            {company?.nombreEmpresa || configId}
                            <button
                              onClick={() => handleUnassignCompany(user.userId, configId)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setEditFormData({
                          name: user.name,
                          email: user.email,
                          role: user.role,
                          password: '',
                        });
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowAssignCompanyModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Asignar Empresa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Crear Usuario</h2>
              <form onSubmit={handleCreateUser}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID (Username de Cognito)
                  </label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ejemplo: juan.perez (sin prefijo agente_)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se creará como: agente_{formData.userId || 'username'}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asesor">Asesor</option>
                    <option value="operador">Operador</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Company Modal */}
        {showAssignCompanyModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-2">
                Asignar Empresa a {selectedUser.name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {selectedUser.assignedCompanies?.length || 0} empresa(s) asignada(s)
              </p>
              
              {/* Empresas asignadas */}
              {selectedUser.assignedCompanies && selectedUser.assignedCompanies.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    ✓ Empresas Asignadas
                  </h3>
                  <div className="space-y-2">
                    {companies
                      .filter(company => selectedUser.assignedCompanies?.includes(company.configId))
                      .map((company) => (
                        <div
                          key={company.configId}
                          className="px-4 py-3 rounded-lg border-2 border-green-300 bg-green-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{company.nombreEmpresa}</div>
                              <div className="text-sm text-gray-600">{company.configId}</div>
                            </div>
                            <button
                              onClick={() => handleUnassignCompany(selectedUser.userId, company.configId)}
                              className="ml-2 text-red-600 hover:text-red-800 font-medium text-sm"
                              title="Desasignar empresa"
                            >
                              🗑️ Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Empresas disponibles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Empresas Disponibles
                </h3>
                <div className="space-y-2">
                  {companies
                    .filter(company => !selectedUser.assignedCompanies?.includes(company.configId))
                    .map((company) => (
                      <button
                        key={company.configId}
                        onClick={() => handleAssignCompany(company.configId)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition"
                      >
                        <div className="font-medium text-gray-900">{company.nombreEmpresa}</div>
                        <div className="text-sm text-gray-500">{company.configId}</div>
                      </button>
                    ))}
                  {companies.filter(company => !selectedUser.assignedCompanies?.includes(company.configId)).length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">
                      Todas las empresas ya están asignadas
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowAssignCompanyModal(false);
                  setSelectedUser(null);
                }}
                className="mt-4 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Editar Usuario</h2>
              <form onSubmit={handleEditUser}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asesor">Asesor</option>
                    <option value="operador">Operador</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dejar vacío para no cambiar"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setEditFormData({ name: '', email: '', role: 'asesor', password: '' });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
        
        {/* Alert Dialog */}
        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        />
      </div>
    </div>
  );
};

export default UsersManagementPage;
