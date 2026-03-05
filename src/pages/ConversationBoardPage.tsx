import React, { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { companyService, Company } from '../services/companyService';
import { conversationStatusService, ConversationStatus, ConversationWithStatus } from '../services/conversationStatusService';
import { conversationService } from '../services/conversationService';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import DraggableConversationCard from '../components/DraggableConversationCard';
import DroppableColumn from '../components/DroppableColumn';

interface Conversation {
  id: string;
  pageId: string;
  senderId: string;
  phoneNumber: string;
  participantName?: string;
  lastMessage: string;
  lastMessageTime: string;
  status: string;
  statusId?: string;
  unreadCount?: number;
  crmIntegrated?: boolean;
  updatedAt?: number;
}

const ConversationBoardPage: React.FC = () => {
  const { user, canAccessCompany } = useUserStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [statuses, setStatuses] = useState<ConversationStatus[]>([]);
  const [conversationsByStatus, setConversationsByStatus] = useState<Record<string, Conversation[]>>({});
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ConversationStatus | null>(null);
  const [statusForm, setStatusForm] = useState({
    name: '',
    color: '#3B82F6',
    isDefault: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openMenuStatusId, setOpenMenuStatusId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('month');
  const [dateField, setDateField] = useState<'createdAt' | 'updatedAt'>('updatedAt');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedConversation, setDraggedConversation] = useState<Conversation | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  const [detailConversation, setDetailConversation] = useState<Conversation | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Colores predefinidos para selección rápida
  const predefinedColors = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#84CC16', // Lime
  ];

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuStatusId) {
        setOpenMenuStatusId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuStatusId]);

  // Cargar empresas
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companyService.getCompanies();
        let filteredCompanies = data;
        if (user && user.role !== 'administrador') {
          filteredCompanies = data.filter(company => canAccessCompany(company.configId));
        }
        setCompanies(filteredCompanies);
        if (filteredCompanies.length > 0) {
          setSelectedCompany(filteredCompanies[0]);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };
    
    if (user) {
      loadCompanies();
    }
  }, [user, canAccessCompany]);

  // Cargar estados y conversaciones cuando cambia la empresa
  useEffect(() => {
    if (selectedCompany) {
      loadStatuses();
      loadConversations();
    }
  }, [selectedCompany]);

  // Recargar conversaciones cuando cambien los filtros de fecha
  useEffect(() => {
    if (selectedCompany) {
      loadConversations();
    }
  }, [datePreset, startDate, endDate, dateField]);

  const loadStatuses = async () => {
    if (!selectedCompany) return;
    try {
      const data = await conversationStatusService.getStatuses(selectedCompany.configId);
      setStatuses(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const loadConversations = async () => {
    if (!selectedCompany) return;
    try {
      setLoading(true);
      const pageId = `whatsapp-${selectedCompany.phoneNumberId}`;
      
      // Calcular timestamps según el preset o fechas personalizadas
      let startTimestamp: number | undefined;
      let endTimestamp: number | undefined;
      
      if (datePreset === 'custom' && startDate && endDate) {
        startTimestamp = new Date(startDate).setHours(0, 0, 0, 0);
        endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);
      } else if (datePreset !== 'all') {
        const now = Date.now();
        endTimestamp = now;
        
        switch (datePreset) {
          case 'today':
            startTimestamp = new Date().setHours(0, 0, 0, 0);
            break;
          case 'week':
            startTimestamp = now - (7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startTimestamp = now - (30 * 24 * 60 * 60 * 1000);
            break;
        }
      }
      
      console.log('📅 Date filter:', { datePreset, dateField, startTimestamp, endTimestamp, startDate, endDate });
      
      const result = await conversationService.getConversations(
        pageId, 
        500, 
        undefined, 
        startTimestamp, 
        endTimestamp,
        dateField
      );
      
      console.log('📥 Loaded conversations:', result.conversations.map(c => ({
        id: c.id,
        statusId: c.statusId,
        hasStatusId: !!c.statusId,
      })));
      
      // Agrupar conversaciones por estado
      const grouped: Record<string, Conversation[]> = {};
      result.conversations.forEach((conv: Conversation) => {
        const statusId = conv.statusId || 'no-status';
        if (!grouped[statusId]) {
          grouped[statusId] = [];
        }
        grouped[statusId].push(conv);
      });
      
      setConversationsByStatus(grouped);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (status?: ConversationStatus) => {
    if (status) {
      setEditingStatus(status);
      setStatusForm({
        name: status.name,
        color: status.color,
        isDefault: status.isDefault || false,
      });
    } else {
      setEditingStatus(null);
      setStatusForm({
        name: '',
        color: '#3B82F6',
        isDefault: false,
      });
    }
    setShowStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setEditingStatus(null);
    setStatusForm({
      name: '',
      color: '#3B82F6',
      isDefault: false,
    });
    setErrorMessage(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedCompany) return;
    
    if (!statusForm.name.trim()) {
      setErrorMessage('El nombre del estado es requerido');
      return;
    }

    try {
      setLoading(true);
      
      if (editingStatus) {
        // Actualizar estado existente
        await conversationStatusService.updateStatus(editingStatus.statusId, statusForm);
        setSuccessMessage('✓ Estado actualizado correctamente');
      } else {
        // Crear nuevo estado
        const newStatus = {
          configId: selectedCompany.configId,
          name: statusForm.name,
          color: statusForm.color,
          order: statuses.length,
          isDefault: statusForm.isDefault,
        };
        await conversationStatusService.createStatus(newStatus);
        setSuccessMessage('✓ Estado creado correctamente');
      }
      
      // Recargar estados
      await loadStatuses();
      handleCloseStatusModal();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving status:', error);
      setErrorMessage(error.response?.data?.error || 'Error al guardar el estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async (status: ConversationStatus) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Estado',
      message: `¿Estás seguro de eliminar el estado "${status.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await conversationStatusService.deleteStatus(status.statusId);
          setSuccessMessage('✓ Estado eliminado correctamente');
          await loadStatuses();
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error: any) {
          console.error('Error deleting status:', error);
          if (error.response?.data?.hasConversations) {
            setErrorMessage('No se puede eliminar un estado con conversaciones activas');
          } else {
            setErrorMessage(error.response?.data?.error || 'Error al eliminar el estado');
          }
          setTimeout(() => setErrorMessage(null), 5000);
        } finally {
          setLoading(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowStatusChangeModal(true);
  };

  const handleChangeConversationStatus = async (newStatusId: string) => {
    if (!selectedConversation || !user) return;

    try {
      setLoading(true);
      await conversationStatusService.setConversationStatus(
        selectedConversation.pageId,
        selectedConversation.senderId,
        newStatusId,
        user.userId,
        user.name,
        user.email
      );
      
      setSuccessMessage('✓ Estado actualizado correctamente');
      
      // Actualizar la conversación localmente
      setConversationsByStatus(prev => {
        const updated = { ...prev };
        
        // Remover de la columna anterior
        const oldStatusId = selectedConversation.statusId || 'no-status';
        if (updated[oldStatusId]) {
          updated[oldStatusId] = updated[oldStatusId].filter(
            c => c.id !== selectedConversation.id
          );
        }
        
        // Agregar a la nueva columna
        if (!updated[newStatusId]) {
          updated[newStatusId] = [];
        }
        updated[newStatusId].push({
          ...selectedConversation,
          statusId: newStatusId,
        });
        
        return updated;
      });
      
      setShowStatusChangeModal(false);
      setSelectedConversation(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error changing status:', error);
      setErrorMessage(error.response?.data?.error || 'Error al cambiar el estado');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar conversaciones por búsqueda y filtros
  const filterConversations = (conversations: Conversation[]) => {
    let filtered = conversations;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.phoneNumber.includes(searchTerm) ||
        (conv.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de no leídos
    if (filterUnread) {
      filtered = filtered.filter(conv => conv.unreadCount && conv.unreadCount > 0);
    }

    // El filtro de fecha ahora se hace en el backend
    return filtered;
  };

  // Calcular estadísticas
  const getStatistics = () => {
    const allConversations = Object.values(conversationsByStatus).flat();
    const totalConversations = allConversations.length;
    const unreadConversations = allConversations.filter(c => c.unreadCount && c.unreadCount > 0).length;
    const conversationsWithStatus = allConversations.filter(c => c.statusId).length;
    const conversationsWithoutStatus = allConversations.filter(c => !c.statusId).length;

    return {
      total: totalConversations,
      unread: unreadConversations,
      withStatus: conversationsWithStatus,
      withoutStatus: conversationsWithoutStatus,
    };
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const allConversations = Object.values(conversationsByStatus).flat();
    const filtered = filterConversations(allConversations);

    // Crear CSV
    const headers = ['Nombre', 'Teléfono', 'Estado', 'Último Mensaje', 'Fecha', 'No Leídos'];
    const rows = filtered.map(conv => {
      const statusName = statuses.find(s => s.statusId === conv.statusId)?.name || 'Sin estado';
      return [
        conv.participantName || 'Sin nombre',
        conv.phoneNumber,
        statusName,
        conv.lastMessage.replace(/,/g, ';'), // Reemplazar comas para no romper CSV
        conv.lastMessageTime,
        conv.unreadCount || 0,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `conversaciones_${selectedCompany?.nombreEmpresa}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage('✓ Archivo CSV descargado correctamente');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Encontrar la conversación que se está arrastrando
    const allConversations = Object.values(conversationsByStatus).flat();
    const conversation = allConversations.find(c => c.id === active.id);
    setDraggedConversation(conversation || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedConversation(null);

    if (!over || active.id === over.id || !user) return;

    const conversationId = active.id as string;
    const newStatusId = over.id as string;

    // Encontrar la conversación
    const allConversations = Object.values(conversationsByStatus).flat();
    const conversation = allConversations.find(c => c.id === conversationId);
    
    if (!conversation) return;

    // Si ya está en ese estado, no hacer nada
    const currentStatusId = conversation.statusId || 'no-status';
    
    console.log('🎯 Drag & Drop:', {
      conversationId,
      currentStatusId,
      newStatusId,
      conversation,
    });
    
    if (currentStatusId === newStatusId) return;

    // Si se mueve a "no-status", no enviar al backend (no es un estado real)
    if (newStatusId === 'no-status') {
      setErrorMessage('No se puede mover a "Sin Estado". Usa el modal para quitar el estado.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      // Actualizar en el backend
      await conversationStatusService.setConversationStatus(
        conversation.pageId,
        conversation.senderId,
        newStatusId,
        user.userId,
        user.name,
        user.email
      );

      // Actualizar localmente
      setConversationsByStatus(prev => {
        const updated = { ...prev };
        
        // Remover de la columna anterior
        if (updated[currentStatusId]) {
          updated[currentStatusId] = updated[currentStatusId].filter(
            c => c.id !== conversationId
          );
        }
        
        // Agregar a la nueva columna
        if (!updated[newStatusId]) {
          updated[newStatusId] = [];
        }
        updated[newStatusId].push({
          ...conversation,
          statusId: newStatusId,
        });
        
        return updated;
      });

      setSuccessMessage('✓ Estado actualizado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error changing status:', error);
      setErrorMessage(error.response?.data?.error || 'Error al cambiar el estado');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Ver historial de una conversación
  const handleViewHistory = async (conversation: Conversation) => {
    try {
      setLoadingHistory(true);
      setShowHistoryModal(true);
      const history = await conversationStatusService.getConversationHistory(
        conversation.pageId,
        conversation.senderId
      );
      setHistoryData(history);
    } catch (error) {
      console.error('Error loading history:', error);
      setErrorMessage('Error al cargar el historial');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Ver detalle de conversación (abrir en nueva pestaña o modal)
  const handleViewDetail = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    // Abrir la página de conversaciones con esta conversación seleccionada
    window.open(`/conversations?pageId=${conversation.pageId}&senderId=${conversation.senderId}`, '_blank');
  };

  // Toggle CRM integration - Solo marca/desmarca, no envía al CRM
  const handleToggleCRM = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await conversationService.markAsCrmIntegrated(conversation.pageId, conversation.senderId);
      
      // Actualizar localmente
      setConversationsByStatus(prev => {
        const updated = { ...prev };
        const statusId = conversation.statusId || 'no-status';
        
        if (updated[statusId]) {
          updated[statusId] = updated[statusId].map(conv => 
            conv.id === conversation.id 
              ? { ...conv, crmIntegrated: !conv.crmIntegrated }
              : conv
          );
        }
        
        return updated;
      });
      
      const message = conversation.crmIntegrated 
        ? '✓ Desmarcado - No integrado en CRM' 
        : '✓ Marcado como integrado en CRM';
      
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error toggling CRM:', error);
      setErrorMessage('Error al actualizar marca de CRM');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">📋 Tablero de Conversaciones</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!selectedCompany || Object.values(conversationsByStatus).flat().length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
            <button
              onClick={() => handleOpenStatusModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Nuevo Estado
            </button>
          </div>
        </div>

        {/* Statistics */}
        {selectedCompany && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{getStatistics().total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-semibold">No leídos</p>
                  <p className="text-2xl font-bold text-green-900">{getStatistics().unread}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-semibold">Con estado</p>
                  <p className="text-2xl font-bold text-purple-900">{getStatistics().withStatus}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Sin estado</p>
                  <p className="text-2xl font-bold text-gray-900">{getStatistics().withoutStatus}</p>
                </div>
                <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Selector and Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Empresa:</label>
            <select
              value={selectedCompany?.configId || ''}
              onChange={(e) => {
                const company = companies.find(c => c.configId === e.target.value);
                if (company) setSelectedCompany(company);
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecciona una empresa --</option>
              {companies.map((company) => (
                <option key={company.configId} value={company.configId}>
                  {company.nombreEmpresa}
                </option>
              ))}
            </select>
            <button
              onClick={loadConversations}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="Actualizar"
            >
              <svg 
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, teléfono o mensaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg 
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex gap-2 items-center">
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value as 'createdAt' | 'updatedAt')}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Campo de fecha para filtrar"
              >
                <option value="updatedAt">Última actividad</option>
                <option value="createdAt">Fecha de creación</option>
              </select>
              
              <select
                value={datePreset}
                onChange={(e) => {
                  const value = e.target.value as any;
                  setDatePreset(value);
                  if (value === 'custom') {
                    // Establecer fechas por defecto: último mes
                    const today = new Date();
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    
                    setEndDate(today.toISOString().split('T')[0]);
                    setStartDate(oneMonthAgo.toISOString().split('T')[0]);
                  } else {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="custom">Rango personalizado</option>
              </select>
              
              {datePreset === 'custom' && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Desde"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hasta"
                  />
                </>
              )}
            </div>
            
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterUnread
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              No leídos
            </button>

            {(searchTerm || filterUnread || datePreset !== 'month' || dateField !== 'updatedAt') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterUnread(false);
                  setDatePreset('month');
                  setDateField('updatedAt');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {statuses.map((status) => (
            <DroppableColumn key={status.statusId} id={status.statusId} className="flex flex-col w-80 bg-gray-100 rounded-lg">
              {/* Column Header */}
              <div 
                className="p-4 rounded-t-lg flex items-center justify-between"
                style={{ backgroundColor: status.color }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{status.name}</h3>
                  <span className="bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {filterConversations(conversationsByStatus[status.statusId] || []).length}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuStatusId(openMenuStatusId === status.statusId ? null : status.statusId);
                    }}
                    className="p-1 hover:bg-white/20 rounded transition"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openMenuStatusId === status.statusId && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10 border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          handleOpenStatusModal(status);
                          setOpenMenuStatusId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteStatus(status);
                          setOpenMenuStatusId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filterConversations(conversationsByStatus[status.statusId] || []).map((conversation) => (
                  <DraggableConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    onClick={() => handleConversationClick(conversation)}
                    onViewDetail={(e) => handleViewDetail(conversation, e)}
                    onToggleCRM={(e) => handleToggleCRM(conversation, e)}
                    onViewHistory={(e) => {
                      e.stopPropagation();
                      handleViewHistory(conversation);
                    }}
                  />
                ))}
                {filterConversations(conversationsByStatus[status.statusId] || []).length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    {searchTerm || filterUnread ? 'Sin resultados' : 'Sin conversaciones'}
                  </div>
                )}
              </div>
            </DroppableColumn>
          ))}

          {/* Sin estado */}
          {conversationsByStatus['no-status'] && conversationsByStatus['no-status'].length > 0 && (
            <DroppableColumn id="no-status" className="flex flex-col w-80 bg-gray-100 rounded-lg">
              <div className="p-4 bg-gray-400 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">Sin Estado</h3>
                  <span className="bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {filterConversations(conversationsByStatus['no-status'] || []).length}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filterConversations(conversationsByStatus['no-status'] || []).map((conversation) => (
                  <DraggableConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    onClick={() => handleConversationClick(conversation)}
                    onViewDetail={(e) => handleViewDetail(conversation, e)}
                    onToggleCRM={(e) => handleToggleCRM(conversation, e)}
                    onViewHistory={(e) => {
                      e.stopPropagation();
                      handleViewHistory(conversation);
                    }}
                  />
                ))}
                {filterConversations(conversationsByStatus['no-status'] || []).length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    {searchTerm || filterUnread ? 'Sin resultados' : 'Sin conversaciones'}
                  </div>
                )}
              </div>
            </DroppableColumn>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedConversation && (
          <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-blue-500 opacity-90 w-80">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(draggedConversation.participantName || draggedConversation.phoneNumber).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {draggedConversation.participantName || 'Sin nombre'}
                </p>
                <p className="text-xs text-gray-500">{draggedConversation.phoneNumber}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {draggedConversation.lastMessage}
            </p>
          </div>
        )}
      </DragOverlay>

      {/* Status Modal - TODO: Implementar en siguiente iteración */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-bold">
                {editingStatus ? 'Editar Estado' : 'Nuevo Estado'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {editingStatus ? 'Modifica las propiedades del estado' : 'Crea un nuevo estado para organizar conversaciones'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Estado *
                </label>
                <input
                  type="text"
                  value={statusForm.name}
                  onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
                  placeholder="Ej: En progreso, Contactado, Finalizado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color
                </label>
                
                {/* Colores predefinidos */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setStatusForm({ ...statusForm, color })}
                      className={`w-full h-10 rounded-lg transition ${
                        statusForm.color === color
                          ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Selector de color personalizado */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Vista previa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vista Previa
                </label>
                <div 
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{ backgroundColor: statusForm.color }}
                >
                  <span className="font-bold text-white">
                    {statusForm.name || 'Nombre del estado'}
                  </span>
                  <span className="bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-full">
                    0
                  </span>
                </div>
              </div>

              {/* Estado por defecto */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={statusForm.isDefault}
                  onChange={(e) => setStatusForm({ ...statusForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700 cursor-pointer">
                  Establecer como estado por defecto para nuevas conversaciones
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50 rounded-b-lg">
              {editingStatus && (
                <button
                  onClick={() => handleDeleteStatus(editingStatus)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 mr-auto"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={handleCloseStatusModal}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={loading || !statusForm.name.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : editingStatus ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Toast */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg text-white font-semibold transition-all z-50 bg-gradient-to-r from-green-500 to-green-600">
          {successMessage}
        </div>
      )}
      {errorMessage && !showStatusModal && (
        <div className="fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg text-white font-semibold transition-all z-50 bg-gradient-to-r from-red-500 to-red-600">
          {errorMessage}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusChangeModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-bold">Cambiar Estado</h2>
              <p className="text-blue-100 text-sm mt-1">
                {selectedConversation.participantName || selectedConversation.phoneNumber}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona el nuevo estado para esta conversación:
              </p>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {statuses.map((status) => {
                  const isCurrentStatus = selectedConversation.statusId === status.statusId;
                  return (
                    <button
                      key={status.statusId}
                      onClick={() => !isCurrentStatus && handleChangeConversationStatus(status.statusId)}
                      disabled={loading || isCurrentStatus}
                      className={`w-full p-4 rounded-lg text-left transition ${
                        isCurrentStatus
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:shadow-md cursor-pointer'
                      }`}
                      style={{ 
                        backgroundColor: status.color,
                        opacity: isCurrentStatus ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{status.name}</span>
                        {isCurrentStatus && (
                          <span className="text-xs text-white bg-white/30 px-2 py-1 rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6 flex gap-3 justify-between bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowStatusChangeModal(false);
                  handleViewHistory(selectedConversation);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ver Historial
              </button>
              <button
                onClick={() => {
                  setShowStatusChangeModal(false);
                  setSelectedConversation(null);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-bold">Historial de Cambios</h2>
              <p className="text-purple-100 text-sm mt-1">
                Registro de todos los cambios de estado
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No hay historial de cambios</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.map((entry, index) => (
                    <div key={entry.historyId} className="relative">
                      {/* Timeline line */}
                      {index < historyData.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      
                      <div className="flex gap-4">
                        {/* Timeline dot */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {entry.previousStatusName ? (
                                  <>
                                    <span className="text-red-600">{entry.previousStatusName}</span>
                                    {' → '}
                                    <span className="text-green-600">{entry.newStatusName}</span>
                                  </>
                                ) : (
                                  <>
                                    Estado asignado: <span className="text-green-600">{entry.newStatusName}</span>
                                  </>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Por: <span className="font-medium">{entry.changedByName}</span>
                                {entry.changedByEmail && (
                                  <span className="text-gray-500"> ({entry.changedByEmail})</span>
                                )}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(entry.timestamp).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistoryData([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DndContext>
  );
};

export default ConversationBoardPage;
