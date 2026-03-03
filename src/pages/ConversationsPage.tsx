import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { conversationService } from '../services/conversationService';
import { companyService, Company } from '../services/companyService';
import { useWebSocket } from '../hooks/useWebSocket';

interface Conversation {
  id: string;
  pageId: string;
  senderId: string;
  phoneNumber: string;
  participantName?: string;
  lastMessage: string;
  lastMessageTime: string;
  status: 'active' | 'archived' | 'completed';
  unreadCount?: number;
  updatedAt?: number;
  crmIntegrated?: boolean;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
}

const ConversationsPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookData, setWebhookData] = useState<any>(null);
  const [contactSource, setContactSource] = useState('4');
  const [webhookModalTab, setWebhookModalTab] = useState<'form' | 'questions'>('form');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [lastConversationKey, setLastConversationKey] = useState<string | undefined>(undefined);

  // Opciones para los selectores
  const sectorOptions = [
    { id: 33, valor: 'Agro Industria' },
    { id: 25, valor: 'Agro Industria' },
    { id: 41, valor: 'Agro Industria' },
    { id: 26, valor: 'Albergue' },
    { id: 27, valor: 'Apicultura' },
    { id: 28, valor: 'Asilo de ancianos' },
    { id: 29, valor: 'Barco' },
    { id: 30, valor: 'Catering' },
    { id: 31, valor: 'Centro de Salud' },
    { id: 32, valor: 'Centro Esparcimiento' },
    { id: 62, valor: 'Centro Naval /Marina de Guerra' },
    { id: 34, valor: 'Clínica' },
    { id: 35, valor: 'Club Deportivo' },
    { id: 36, valor: 'Club Social' },
    { id: 39, valor: 'Colegio' },
    { id: 40, valor: 'Condominios' },
    { id: 42, valor: 'Contratista' },
    { id: 43, valor: 'Distribuidor / Intermediario' },
    { id: 44, valor: 'Domicilio' },
    { id: 60, valor: 'Ejercito' },
    { id: 37, valor: 'Empresa de Telecomunicaciones' },
    { id: 38, valor: 'Empresa de Transporte' },
    { id: 61, valor: 'Fuerza Aerea' },
    { id: 46, valor: 'Hospital' },
    { id: 47, valor: 'Hotel' },
    { id: 48, valor: 'Iglesia' },
    { id: 49, valor: 'Industria en General' },
    { id: 50, valor: 'Lavanderia Comercial' },
    { id: 51, valor: 'Lavanderia Industrial' },
    { id: 52, valor: 'Mina' },
    { id: 56, valor: 'Municipalidad' },
    { id: 45, valor: 'Oficina' },
    { id: 53, valor: 'Peluquería' },
    { id: 54, valor: 'Pesquero' },
    { id: 55, valor: 'Petrolero /Exploracion' },
    { id: 57, valor: 'Restaurante' },
    { id: 58, valor: 'Textil / Confeccionista' },
    { id: 59, valor: 'Universidad' },
  ];

  const condicionOptions = [
    { id: 22, valor: 'EXPORTACIÓN' },
    { id: 23, valor: 'EXW' },
    { id: 20, valor: 'LIMA' },
    { id: 21, valor: 'PROVINCIA' },
    { id: 24, valor: 'PROYECTO' },
  ];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const conversationsListRef = useRef<HTMLDivElement>(null);
  const lastConversationKeyRef = useRef<string | undefined>(undefined);

  // Mantener la referencia actualizada
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Cargar empresas al montar
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companyService.getCompanies();
        setCompanies(data);
        if (data.length > 0) {
          setSelectedCompany(data[0]);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };
    loadCompanies();
  }, []);

  const loadConversations = useCallback(async (append: boolean = false) => {
    if (!selectedCompany?.phoneNumberId) return;

    try {
      setLoading(true);
      // Usar pageId en formato whatsapp-{phoneNumberId}
      const pageId = `whatsapp-${selectedCompany.phoneNumberId}`;
      const keyToUse = append ? lastConversationKeyRef.current : undefined;
      const result = await conversationService.getConversations(pageId, 500, keyToUse);
      
      if (append) {
        setConversations(prev => [...prev, ...result.conversations]);
      } else {
        setConversations(result.conversations);
        setSelectedConversation(null);
        setMessages([]);
      }
      
      setHasMoreConversations(result.hasMore);
      setLastConversationKey(result.lastKey);
      lastConversationKeyRef.current = result.lastKey;
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  // Scroll infinito para cargar más conversaciones
  const handleConversationsScroll = useCallback(() => {
    const element = conversationsListRef.current;
    if (!element || loading || !hasMoreConversations) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    // Cargar más cuando esté a 100px del final
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadConversations(true);
    }
  }, [loading, hasMoreConversations, loadConversations]);

  // Cargar conversaciones cuando cambia la empresa seleccionada
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const pageId = selectedCompany ? `whatsapp-${selectedCompany.phoneNumberId}` : '';

  // Manejar mensajes WebSocket
  const handleWebSocketMessage = useCallback((wsMessage: any) => {
    console.log('🔔 WebSocket message received in ConversationsPage:', wsMessage);
    console.log('Current selected conversation:', selectedConversationRef.current);
    
    if (wsMessage.type === 'message') {
      console.log('📨 Processing message type');
      // Solo agregar el mensaje a la vista si es para la conversación actual
      if (selectedConversationRef.current && wsMessage.senderId === selectedConversationRef.current.senderId) {
        console.log('✅ Message is for current conversation, adding to messages');
        const newMessage: Message = {
          id: `ws-${Date.now()}`,
          sender: wsMessage.data.direction === 'incoming' ? (wsMessage.data.senderName || 'Usuario') : 'Bot',
          content: wsMessage.data.message,
          timestamp: new Date(wsMessage.data.timestamp).toISOString(),
          direction: wsMessage.data.direction === 'incoming' ? 'inbound' : 'outbound',
        };
        setMessages(prev => [...prev, newMessage]);
      } else {
        console.log('⚠️ Message is NOT for current conversation or no conversation selected');
      }
    } else if (wsMessage.type === 'conversation_update') {
      console.log('📋 Processing conversation_update type');
      // Actualizar conversación en la lista
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.senderId === wsMessage.senderId) {
            // Si es un mensaje entrante y NO es la conversación seleccionada, incrementar unreadCount
            const isIncomingMessage = wsMessage.data.direction === 'incoming';
            const isSelectedConversation = selectedConversationRef.current?.senderId === wsMessage.senderId;
            
            return {
              ...conv,
              lastMessage: wsMessage.data.lastMessage,
              lastMessageTime: new Date(wsMessage.data.updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              unreadCount: isIncomingMessage && !isSelectedConversation 
                ? (conv.unreadCount || 0) + 1 
                : conv.unreadCount,
              updatedAt: wsMessage.data.updatedAt // Actualizar timestamp para ordenamiento
            };
          }
          return conv;
        });
        
        // Reordenar: mover la conversación actualizada al principio
        const sortedConversations = updated.sort((a, b) => {
          const aTime = a.updatedAt || 0;
          const bTime = b.updatedAt || 0;
          return bTime - aTime;
        });
        
        // Si la conversación no existe en la lista, recargar todas las conversaciones
        const conversationExists = updated.some(conv => conv.senderId === wsMessage.senderId);
        if (!conversationExists) {
          console.log(`New conversation detected for senderId: ${wsMessage.senderId}, reloading conversations`);
          loadConversations();
        }
        
        return sortedConversations;
      });
    }
  }, [loadConversations]);

  // Conectar WebSocket con el senderId de la conversación seleccionada
  useWebSocket(pageId, selectedConversation?.senderId, handleWebSocketMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    try {
      const data = await conversationService.getMessages(conversation.pageId, conversation.senderId);
      setMessages(data);
      
      // Resetear el contador de mensajes no leídos
      if (conversation.unreadCount && conversation.unreadCount > 0) {
        await conversationService.markAsRead(conversation.pageId, conversation.senderId);
        // Actualizar la conversación en la lista local
        setConversations(prev => prev.map(conv =>
          conv.senderId === conversation.senderId
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    try {
      setLoading(true);
      await conversationService.sendMessage(selectedConversation.pageId, selectedConversation.senderId, replyMessage);
      setReplyMessage('');
      // Reload messages
      const data = await conversationService.getMessages(selectedConversation.pageId, selectedConversation.senderId);
      setMessages(data);
      // Reload conversations to update last message pero mantener la conversación seleccionada
      if (selectedCompany?.phoneNumberId) {
        const pageId = `whatsapp-${selectedCompany.phoneNumberId}`;
        const result = await conversationService.getConversations(pageId);
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    try {
      setLoading(true);
      
      // Determinar tipo de archivo
      let fileType = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      }

      console.log(`Sending ${fileType}: ${file.name}`);
      
      await conversationService.sendFileBlob(
        selectedConversation.pageId,
        selectedConversation.senderId,
        file,
        fileType,
        replyMessage || undefined
      );

      setReplyMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload messages
      const data = await conversationService.getMessages(selectedConversation.pageId, selectedConversation.senderId);
      setMessages(data);
      // Reload conversations to update last message pero mantener la conversación seleccionada
      if (selectedCompany?.phoneNumberId) {
        const pageId = `whatsapp-${selectedCompany.phoneNumberId}`;
        const result = await conversationService.getConversations(pageId);
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Error sending file:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.phoneNumber.includes(searchTerm) ||
      (conv.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // Extraer preguntas y respuestas del flujo
  const extractQuestionsAndAnswers = () => {
    const questionsAnswers: Array<{ question: string; answer: string }> = [];
    
    // Buscar patrones de pregunta-respuesta en los mensajes
    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];
      
      // Si el mensaje actual es del bot (outbound) y el siguiente es del usuario (inbound)
      if (currentMsg.direction === 'outbound' && nextMsg.direction === 'inbound') {
        // Verificar que sea una pregunta (termina con ?)
        if (currentMsg.content.includes('?')) {
          questionsAnswers.push({
            question: currentMsg.content,
            answer: nextMsg.content,
          });
        }
      }
    }
    
    return questionsAnswers;
  };

  const handleOpenWebhookModal = () => {
    if (!selectedCompany?.urlWebHook) {
      alert('La empresa no tiene configurado un webhook');
      return;
    }

    const questionsAnswers = extractQuestionsAndAnswers();
    
    // Crear descripción solo con las respuestas del cliente
    const clientResponses = questionsAnswers
      .map((qa: any) => qa.answer)
      .join(' | ');
    
    // Agregar fecha actual al inicio de la descripción (formato: DD-MM-YYYY)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const currentDate = `${day}-${month}-${year}`;
    const descripcionConFecha = `${currentDate} | ${clientResponses}`;
    
    const dataToSend = {
      phoneNumber: selectedConversation?.phoneNumber,
      participantName: selectedConversation?.participantName || 'Sin nombre',
      questionsAnswers: questionsAnswers,
      contactSource: contactSource,
      sector: '50', // Valor por defecto: Lavandería Comercial
      condicion: '20', // Valor por defecto
      descripcion: descripcionConFecha,
      timestamp: new Date().toISOString(),
    };

    setWebhookData(dataToSend);
    setShowWebhookModal(true);
  };

  const handleSendToWebhook = async () => {
    if (!webhookData || !selectedCompany?.urlWebHook || !selectedConversation) return;

    try {
      setLoading(true);
      
      // Transformar los datos al formato esperado por la API
      const transformedData = {
        celular: webhookData.phoneNumber.replace(/\D/g, ''), // Solo números
        clieNombre: webhookData.participantName,
        clieNumero: '', // No disponible en los datos actuales
        clieTipDoc: '', // No disponible en los datos actuales
        condicion: parseInt(webhookData.condicion), // ID de la condición
        clieDireccion: '', // No disponible en los datos actuales
        email: '', // No disponible en los datos actuales
        fuente: parseInt(webhookData.contactSource), // ID de la fuente
        sector: parseInt(webhookData.sector), // ID del sector
        telefono: webhookData.phoneNumber.replace(/\D/g, ''), // Solo números
        contacto: webhookData.participantName,
        puesto: '', // No disponible en los datos actuales
        descripcion: webhookData.descripcion, // Descripción editada por el usuario
        usuario: '', // Se puede obtener del usuario logueado si es necesario
        operacion: 'saveLead',
      };
      
      await conversationService.sendToWebhook(selectedCompany.urlWebHook, transformedData);
      
      // Marcar la conversación como integrada con CRM
      await conversationService.markAsCrmIntegrated(selectedConversation.pageId, selectedConversation.senderId);
      
      // Actualizar la conversación en la lista local
      setConversations(prev => prev.map(conv =>
        conv.senderId === selectedConversation.senderId
          ? { ...conv, crmIntegrated: true }
          : conv
      ));
      
      // Actualizar la conversación seleccionada
      setSelectedConversation(prev => prev ? { ...prev, crmIntegrated: true } : null);
      
      setSuccessMessage('✓ Datos enviados al webhook correctamente');
      setShowWebhookModal(false);
      setWebhookData(null);
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error sending to webhook:', error);
      setSuccessMessage('✗ Error al enviar datos al webhook');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Conversations List - WhatsApp Style */}
      <div className="w-96 bg-white flex flex-col border-r border-gray-200 shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h1 className="text-2xl font-bold">💬 Mensajes</h1>
          <p className="text-blue-100 text-sm mt-1">Gestión de conversaciones</p>
        </div>

        {/* Company Selector */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <label className="block text-xs font-semibold text-gray-700 mb-2">Selecciona una empresa</label>
          <select
            value={selectedCompany?.configId || ''}
            onChange={(e) => {
              const company = companies.find(c => c.configId === e.target.value);
              if (company) {
                setSelectedCompany(company);
              }
            }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">-- Selecciona una empresa --</option>
            {companies.map((company) => (
              <option key={company.configId} value={company.configId}>
                {company.nombreEmpresa}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar conversación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div 
          ref={conversationsListRef}
          onScroll={handleConversationsScroll}
          className="flex-1 overflow-y-auto"
        >
          {loading && filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Cargando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>No hay conversaciones</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition flex items-center gap-3 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(conversation.participantName || conversation.phoneNumber).charAt(0).toUpperCase()}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`truncate ${conversation.unreadCount && conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                      {conversation.participantName || conversation.phoneNumber}
                    </p>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <p className="text-xs text-gray-500">{conversation.lastMessageTime}</p>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm truncate ${conversation.unreadCount && conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
              </button>
            ))
          )}
          {loading && filteredConversations.length > 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Cargando más conversaciones...
            </div>
          )}
        </div>
      </div>

      {/* Messages Area - WhatsApp Style */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {(selectedConversation.participantName || selectedConversation.phoneNumber).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.participantName || 'Usuario'}
                    </h3>
                    {selectedConversation.crmIntegrated && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ✓ Integrado con CRM
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">En línea</p>
                    <span className="text-xs text-gray-400">•</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedConversation.phoneNumber);
                        alert('Número copiado: ' + selectedConversation.phoneNumber);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition font-mono"
                      title="Haz clic para copiar"
                    >
                      {selectedConversation.phoneNumber}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleOpenWebhookModal}
                  disabled={loading || !selectedCompany?.urlWebHook || selectedConversation.crmIntegrated}
                  className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedConversation.crmIntegrated ? "Ya integrado con CRM" : "Enviar a webhook"}
                >
                  🔗
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                  🔍
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                  ⋮
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-2">💬</div>
                    <p>Inicia una conversación</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          message.direction === 'outbound'
                            ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                            : 'bg-white text-gray-900 rounded-bl-none border border-gray-200 shadow-sm'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.direction === 'outbound'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2 items-end">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600 text-xl"
                  title="Enviar archivo"
                >
                  📎
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <button
                  onClick={handleSendReply}
                  disabled={loading || !replyMessage.trim()}
                  className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed text-green-600 text-xl"
                >
                  {replyMessage.trim() ? '📤' : '🎤'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Selecciona una conversación</p>
              <p className="text-sm mt-2">para ver los mensajes</p>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Modal */}
      {showWebhookModal && webhookData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <h2 className="text-xl font-bold">Validar datos para enviar</h2>
              <p className="text-blue-100 text-sm mt-1">Revisa los datos antes de enviar al webhook</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setWebhookModalTab('form')}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition ${
                  webhookModalTab === 'form'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Formulario
              </button>
              <button
                onClick={() => setWebhookModalTab('questions')}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition ${
                  webhookModalTab === 'questions'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ❓ Preguntas
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {webhookModalTab === 'form' ? (
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={webhookData.participantName}
                      onChange={(e) => setWebhookData({ ...webhookData, participantName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={webhookData.phoneNumber}
                      onChange={(e) => setWebhookData({ ...webhookData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    />
                  </div>

                  {/* Fuente de Contacto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fuente de Contacto</label>
                    <select
                      value={webhookData.contactSource}
                      onChange={(e) => setWebhookData({ ...webhookData, contactSource: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="4">WhatsApp</option>
                      <option value="3">Facebook</option>
                      <option value="10">TikTok</option>
                      <option value="2">Formulario Web</option>
                      <option value="5">Llamada Mensaje Directo</option>
                      <option value="8">Referido</option>
                      <option value="6">Cliente Antiguo</option>
                      <option value="65">Feria EXPOMIN</option>
                      <option value="11">Formulario Adex</option>
                      <option value="64">Referido CALIDDA</option>
                      <option value="7">Referido por Alicorp</option>
                      <option value="9">Visita Presencial</option>
                    </select>
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sector</label>
                    <select
                      value={webhookData.sector}
                      onChange={(e) => setWebhookData({ ...webhookData, sector: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {sectorOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.valor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condición */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Condición</label>
                    <select
                      value={webhookData.condicion}
                      onChange={(e) => setWebhookData({ ...webhookData, condicion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {condicionOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.valor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={webhookData.descripcion}
                      onChange={(e) => setWebhookData({ ...webhookData, descripcion: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Resumen de respuestas del cliente"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhookData.questionsAnswers.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay preguntas respondidas</p>
                  ) : (
                    webhookData.questionsAnswers.map((qa: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">P: {qa.question}</p>
                        <p className="text-xs text-gray-600">R: {qa.answer}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-white">
              <button
                onClick={() => {
                  setShowWebhookModal(false);
                  setWebhookData(null);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendToWebhook}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar al Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg text-white font-semibold transition-all z-40 ${
          successMessage.startsWith('✓') 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default ConversationsPage;
