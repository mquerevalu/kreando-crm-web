import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useUserStore } from '../store/userStore';
import { conversationService } from '../services/conversationService';
import { companyService, Company } from '../services/companyService';
import { userService, User } from '../services/userService';
import { useWebSocket } from '../hooks/useWebSocket';
import MediaViewer from '../components/MediaViewer';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import WhatsAppTemplateModal from '../components/WhatsAppTemplateModal';
import { whatsappTemplateService } from '../services/whatsappTemplateService';
import { useSearchParams } from 'react-router-dom';

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
  agentEnabled?: boolean;
  assignedTo?: string; // userId del asesor asignado
  canSendFreeform?: boolean; // Puede enviar mensajes normales (dentro de 24h)
  hoursSinceLastMessage?: number; // Horas desde el último mensaje
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  s3Key?: string;
  mediaType?: string;
  mediaFileName?: string;
}

const ConversationsPage: React.FC = () => {
  const { user, canAccessCompany, canAccessConversation } = useUserStore();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showChatInMobile, setShowChatInMobile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Ref para controlar si ya se seleccionó una conversación desde URL
  const hasAutoSelectedRef = useRef(false);
  
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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mantener la referencia actualizada
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Cargar empresas al montar
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companyService.getCompanies();
        
        console.log('👤 Usuario actual:', user);
        console.log('🏢 Empresas obtenidas:', data);
        
        // Filtrar empresas según permisos del usuario
        let filteredCompanies = data;
        if (user && user.role !== 'administrador') {
          console.log('🔒 Filtrando empresas para rol:', user.role);
          console.log('📋 Empresas asignadas:', user.assignedCompanies);
          filteredCompanies = data.filter(company => {
            const hasAccess = canAccessCompany(company.configId);
            console.log(`  - ${company.nombreEmpresa} (${company.configId}): ${hasAccess ? '✅' : '❌'}`);
            return hasAccess;
          });
        }
        
        console.log('✅ Empresas filtradas:', filteredCompanies);
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

  const loadConversations = useCallback(async (append: boolean = false) => {
    if (!selectedCompany?.phoneNumberId) return;

    try {
      setLoading(true);
      // Usar pageId en formato whatsapp-{phoneNumberId}
      const pageId = `whatsapp-${selectedCompany.phoneNumberId}`;
      const keyToUse = append ? lastConversationKeyRef.current : undefined;
      const result = await conversationService.getConversations(pageId, 500, keyToUse);
      
      console.log('💬 Conversaciones obtenidas:', result.conversations.length);
      console.log('👤 Rol del usuario:', user?.role);
      
      // Filtrar conversaciones según permisos del usuario
      // - Administradores: ven todo
      // - Operadores: ven todas las conversaciones de sus empresas asignadas
      // - Asesores: solo ven conversaciones específicas asignadas
      let filteredConversations = result.conversations;
      
      if (user) {
        if (user.role === 'asesor') {
          console.log('🔒 Filtrando conversaciones para ASESOR');
          console.log('📋 Conversaciones asignadas:', user.assignedConversations);
          filteredConversations = result.conversations.filter(conv => {
            const hasAccess = canAccessConversation(conv.pageId, conv.senderId);
            console.log(`  - ${conv.phoneNumber}: ${hasAccess ? '✅' : '❌'}`);
            return hasAccess;
          });
        } else if (user.role === 'operador') {
          console.log('✅ Usuario OPERADOR: ve todas las conversaciones de la empresa');
          // Los operadores ven todas las conversaciones de sus empresas asignadas
          // No se filtra por conversación específica
        } else {
          console.log('✅ Usuario ADMINISTRADOR: ve todas las conversaciones');
          // Los administradores ven todo
        }
      }
      
      console.log('✅ Conversaciones filtradas:', filteredConversations.length);
      
      if (append) {
        setConversations(prev => [...prev, ...filteredConversations]);
      } else {
        setConversations(filteredConversations);
        // No resetear selectedConversation si hay parámetros de URL (auto-selección pendiente)
        // o si ya hay una conversación seleccionada
        const hasUrlParams = searchParams.get('pageId') && searchParams.get('senderId');
        if (!hasUrlParams && !selectedConversation) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
      
      setHasMoreConversations(result.hasMore);
      setLastConversationKey(result.lastKey);
      lastConversationKeyRef.current = result.lastKey;
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, user, canAccessConversation]);

  // Scroll infinito para cargar más conversaciones con debounce
  const handleConversationsScroll = useCallback(() => {
    const element = conversationsListRef.current;
    if (!element || loading || !hasMoreConversations) return;

    // Limpiar timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce de 150ms
    scrollTimeoutRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      // Cargar más cuando esté a 200px del final (más anticipado)
      if (scrollHeight - scrollTop - clientHeight < 200) {
        loadConversations(true);
      }
    }, 150);
  }, [loading, hasMoreConversations, loadConversations]);

  // Cargar conversaciones cuando cambia la empresa seleccionada
  useEffect(() => {
    loadConversations();
    
    // Cleanup del timeout al desmontar
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [loadConversations]);

  // Seleccionar conversación automáticamente desde URL (solo una vez)
  useEffect(() => {
    // Si ya se seleccionó, no hacer nada
    if (hasAutoSelectedRef.current) return;
    
    const pageIdParam = searchParams.get('pageId');
    const senderIdParam = searchParams.get('senderId');
    
    if (pageIdParam && senderIdParam && conversations.length > 0 && !selectedConversation) {
      // Buscar la conversación que coincida
      const targetConversation = conversations.find(
        conv => conv.pageId === pageIdParam && conv.senderId === senderIdParam
      );
      
      if (targetConversation) {
        console.log('🎯 Auto-selecting conversation from URL:', targetConversation);
        hasAutoSelectedRef.current = true; // Marcar como seleccionado
        handleSelectConversation(targetConversation);
        
        // Limpiar los parámetros de la URL después de seleccionar
        setTimeout(() => {
          setSearchParams({});
        }, 100);
      }
    }
  }, [conversations, searchParams, selectedConversation]);

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
          s3Key: wsMessage.data.s3Key,
          mediaType: wsMessage.data.mediaType,
          mediaFileName: wsMessage.data.mediaFileName,
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
        
        // Si la conversación no existe en la lista, verificar si el usuario tiene acceso antes de recargar
        const conversationExists = updated.some(conv => conv.senderId === wsMessage.senderId);
        if (!conversationExists) {
          console.log(`New conversation detected for senderId: ${wsMessage.senderId}`);
          
          // Si es asesor, verificar si tiene acceso a esta conversación
          if (user?.role === 'asesor') {
            const hasAccess = canAccessConversation(wsMessage.pageId || pageId, wsMessage.senderId);
            if (hasAccess) {
              console.log('✅ Asesor tiene acceso, recargando conversaciones');
              loadConversations();
            } else {
              console.log('❌ Asesor NO tiene acceso, ignorando conversación nueva');
            }
          } else {
            // Administradores y operadores siempre recargan
            console.log('✅ Recargando conversaciones para admin/operador');
            loadConversations();
          }
        }
        
        return sortedConversations;
      });
    }
  }, [loadConversations, user, canAccessConversation, pageId]);

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
    setShowChatInMobile(true); // Mostrar chat en mobile
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

  const handleBackToConversations = () => {
    setShowChatInMobile(false);
    setSelectedConversation(null);
  };

  const handleToggleAgent = async () => {
    if (!selectedConversation) return;

    try {
      const newAgentEnabled = await conversationService.toggleAgent(
        selectedConversation.pageId,
        selectedConversation.senderId
      );

      // Actualizar el estado local
      setSelectedConversation({
        ...selectedConversation,
        agentEnabled: newAgentEnabled,
      });

      // Actualizar también en la lista de conversaciones
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.senderId === selectedConversation.senderId && conv.pageId === selectedConversation.pageId
            ? { ...conv, agentEnabled: newAgentEnabled }
            : conv
        )
      );

      console.log(`Agent ${newAgentEnabled ? 'enabled' : 'disabled'} for conversation`);
    } catch (error) {
      console.error('Error toggling agent:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al cambiar el estado del agente',
        type: 'error',
      });
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    // Guardar el mensaje y limpiar el campo inmediatamente para evitar doble envío
    const messageToSend = replyMessage.trim();
    setReplyMessage('');

    try {
      setLoading(true);
      await conversationService.sendMessage(selectedConversation.pageId, selectedConversation.senderId, messageToSend);
      // Reload messages
      const data = await conversationService.getMessages(selectedConversation.pageId, selectedConversation.senderId);
      setMessages(data);
      // Reload conversations to update last message pero mantener la conversación seleccionada
      if (selectedCompany?.phoneNumberId) {
        const pageId = `whatsapp-${selectedCompany.phoneNumberId}`;
        const result = await conversationService.getConversations(pageId);
        
        // Aplicar el mismo filtro que en loadConversations
        let filteredConversations = result.conversations;
        if (user?.role === 'asesor') {
          filteredConversations = result.conversations.filter(conv => 
            canAccessConversation(conv.pageId, conv.senderId)
          );
        }
        
        setConversations(filteredConversations);
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
      setIsUploading(true);
      setUploadProgress(0);
      
      // Determinar tipo de archivo
      let fileType = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      }

      console.log(`Sending ${fileType}: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Usar método diferente según el tamaño del archivo
      const FILE_SIZE_LIMIT = 8 * 1024 * 1024; // 8MB (dejamos margen bajo el límite de 10MB)
      
      if (file.size > FILE_SIZE_LIMIT) {
        console.log('Using large file upload (direct to S3)');
        // Archivos grandes: subir directamente a S3
        await conversationService.sendLargeFile(
          selectedConversation.pageId,
          selectedConversation.senderId,
          file,
          fileType,
          replyMessage || undefined,
          (progress) => setUploadProgress(progress)
        );
      } else {
        console.log('Using standard upload (via Lambda)');
        // Archivos pequeños: método tradicional
        await conversationService.sendFileBlob(
          selectedConversation.pageId,
          selectedConversation.senderId,
          file,
          fileType,
          replyMessage || undefined
        );
      }

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
        
        // Aplicar el mismo filtro que en loadConversations
        let filteredConversations = result.conversations;
        if (user?.role === 'asesor') {
          filteredConversations = result.conversations.filter(conv => 
            canAccessConversation(conv.pageId, conv.senderId)
          );
        }
        
        setConversations(filteredConversations);
      }
    } catch (error) {
      console.error('Error sending file:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al enviar el archivo. Por favor intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
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
      setAlertDialog({
        isOpen: true,
        title: 'Webhook no configurado',
        message: 'La empresa no tiene configurado un webhook',
        type: 'warning',
      });
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

  const handleOpenAssignModal = async () => {
    if (!user || (user.role !== 'administrador' && user.role !== 'operador')) {
      return;
    }
    
    if (!selectedCompany || !selectedConversation) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'No hay empresa o conversación seleccionada',
        type: 'error',
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Verificar si ya tiene asignación
      const assignmentData = await userService.getConversationAssignment(
        selectedConversation.pageId,
        selectedConversation.senderId
      );
      
      setCurrentAssignment(assignmentData.assigned ? assignmentData.assignment : null);
      
      // Cargar lista de asesores asignados a esta empresa
      const advisorsList = await userService.listAdvisors(selectedCompany.configId);
      
      if (advisorsList.length === 0) {
        setAlertDialog({
          isOpen: true,
          title: 'Sin asesores',
          message: 'No hay asesores asignados a esta empresa. Por favor, asigna asesores desde el panel de usuarios.',
          type: 'warning',
        });
        setLoading(false);
        return;
      }
      
      setAdvisors(advisorsList);
      setShowAssignModal(true);
    } catch (error) {
      console.error('Error loading advisors:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al cargar la información de asignación',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignConversation = async () => {
    if (!currentAssignment || !selectedConversation) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Desasignar conversación',
      message: `¿Desasignar esta conversación de ${currentAssignment.advisorName}?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true);
          await userService.unassignConversation(
            currentAssignment.userId,
            selectedConversation.pageId,
            selectedConversation.senderId
          );
          
          setCurrentAssignment(null);
          setSuccessMessage('✓ Conversación desasignada correctamente');
          
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
          console.error('Error unassigning conversation:', error);
          setSuccessMessage('✗ Error al desasignar conversación');
          setTimeout(() => setSuccessMessage(null), 3000);
        } finally {
          setLoading(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleAssignConversation = async (advisorId: string) => {
    if (!selectedConversation) return;
    
    try {
      setLoading(true);
      await userService.assignConversation(
        advisorId,
        selectedConversation.pageId,
        selectedConversation.senderId
      );
      
      // Recargar la asignación actual
      const assignmentData = await userService.getConversationAssignment(
        selectedConversation.pageId,
        selectedConversation.senderId
      );
      setCurrentAssignment(assignmentData.assigned ? assignmentData.assignment : null);
      
      setSuccessMessage('✓ Conversación asignada correctamente');
      setShowAssignModal(false);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error assigning conversation:', error);
      setSuccessMessage('✗ Error al asignar conversación');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplate = async (templateName: string, languageCode: string, components: any[]) => {
    if (!selectedConversation || !selectedCompany) return;

    try {
      setLoading(true);
      
      await whatsappTemplateService.sendTemplate(
        selectedCompany.phoneNumberId,
        selectedConversation.phoneNumber,
        templateName,
        languageCode,
        components,
        user?.name || 'Asesor' // Pasar el nombre del usuario
      );

      setSuccessMessage('✓ Plantilla enviada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload messages sin cerrar la conversación
      const data = await conversationService.getMessages(selectedConversation.pageId, selectedConversation.senderId);
      setMessages(data);
      
      // NO recargar todas las conversaciones para evitar que se cierre el chat
      // El WebSocket ya actualizará la lista automáticamente
    } catch (error) {
      console.error('Error sending template:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al enviar la plantilla. Por favor intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const get24HourWindowStatus = () => {
    if (!selectedConversation?.hoursSinceLastMessage) return { color: 'green', text: 'Activa', icon: '✓' };
    
    const hours = selectedConversation.hoursSinceLastMessage;
    
    if (hours < 20) {
      return { color: 'green', text: `${Math.floor(hours)}h restantes`, icon: '✓' };
    } else if (hours < 24) {
      return { color: 'yellow', text: `${Math.floor(24 - hours)}h restantes`, icon: '⚠️' };
    } else {
      return { color: 'red', text: 'Ventana cerrada', icon: '🔒' };
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Conversations List - WhatsApp Style - Ocultar en mobile cuando hay chat seleccionado */}
      <div className={`${showChatInMobile ? 'hidden' : 'flex'} md:flex w-full md:w-96 bg-white flex-col border-r border-gray-200 shadow-sm`}>
        {/* Header - Estilo WhatsApp */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Mensajes</h1>
          <button
            onClick={() => loadConversations(false)}
            disabled={loading}
            className="p-2 hover:bg-white/20 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar conversaciones"
          >
            <svg 
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
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

      {/* Messages Area - WhatsApp Style - Mostrar en mobile solo cuando hay chat seleccionado */}
      <div className={`${!showChatInMobile && selectedConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white`}>
        {selectedConversation ? (
          <>
            {/* Chat Header - Estilo WhatsApp */}
            <div className="bg-[#008069] text-white p-3 flex items-center gap-3 shadow-md">
              {/* Botón volver (solo mobile) */}
              <button 
                onClick={handleBackToConversations}
                className="md:hidden p-2 hover:bg-white/10 rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Avatar y nombre */}
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {(selectedConversation.participantName || selectedConversation.phoneNumber).charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {selectedConversation.participantName || 'Usuario'}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/80 truncate">{selectedConversation.phoneNumber}</p>
                  {/* Indicador de ventana de 24 horas */}
                  {(() => {
                    const status = get24HourWindowStatus();
                    return (
                      <span 
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          status.color === 'green' ? 'bg-green-500/30 text-green-100' :
                          status.color === 'yellow' ? 'bg-yellow-500/30 text-yellow-100' :
                          'bg-red-500/30 text-red-100'
                        }`}
                        title={`Ventana de mensajería: ${status.text}`}
                      >
                        {status.icon} {status.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
              
              {/* Acciones */}
              <div className="flex gap-2 items-center">
                {/* Toggle del agente */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/90 hidden sm:inline">Agente</span>
                  <button
                    onClick={handleToggleAgent}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      selectedConversation.agentEnabled !== false ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    title={selectedConversation.agentEnabled !== false ? 'Agente activado' : 'Agente desactivado'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedConversation.agentEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {selectedConversation.crmIntegrated && (
                  <span className="hidden md:inline-flex px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                    ✓ CRM
                  </span>
                )}
                {(user?.role === 'administrador' || user?.role === 'operador') && (
                  <button 
                    onClick={handleOpenAssignModal}
                    disabled={loading}
                    className="p-2 hover:bg-white/10 rounded-full transition disabled:opacity-50"
                    title="Asignar a asesor"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                )}
                <button 
                  onClick={handleOpenWebhookModal}
                  disabled={loading || !selectedCompany?.urlWebHook}
                  className="p-2 hover:bg-white/10 rounded-full transition disabled:opacity-50"
                  title="Enviar a webhook"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button className="hidden md:block p-2 hover:bg-white/10 rounded-full transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages - Fondo estilo WhatsApp */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#efeae2]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\'/%3E%3Cpath d=\'M20 20h60v60H20z\' fill=\'%23f0f0f0\' opacity=\'.1\'/%3E%3C/svg%3E")'}}>

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
                        className={`max-w-[85%] md:max-w-md px-3 py-2 rounded-lg shadow ${
                          message.direction === 'outbound'
                            ? 'bg-[#d9fdd3] text-gray-900'
                            : 'bg-white text-gray-900'
                        }`}
                      >
                        {/* Renderizar multimedia si existe */}
                        {message.s3Key && message.mediaType && (
                          <MediaViewer
                            s3Key={message.s3Key}
                            mediaType={message.mediaType}
                            mediaFileName={message.mediaFileName}
                            direction={message.direction}
                          />
                        )}
                        
                        {/* Texto del mensaje */}
                        <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                        <p className="text-[10px] text-gray-500 mt-1 text-right">
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

            {/* Input Area - Estilo WhatsApp */}
            <div className="bg-[#f0f0f0] p-2 flex gap-2 items-center">
              {/* Indicador de progreso de subida */}
              {isUploading && (
                <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Subiendo archivo...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#008069] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Botón de plantilla (siempre visible) */}
              <button
                onClick={() => setShowTemplateModal(true)}
                disabled={loading || !selectedCompany?.accessToken}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition text-white disabled:opacity-50 flex-shrink-0"
                title="Enviar plantilla aprobada"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600 disabled:opacity-50"
                title="Enviar archivo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              <div className="flex-1 flex gap-2 bg-white rounded-full px-4 py-2">
                <input
                  type="text"
                  placeholder="Mensaje"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                />
              </div>
              <button
                onClick={handleSendReply}
                disabled={loading || isUploading || !replyMessage.trim()}
                className="p-2 bg-[#008069] hover:bg-[#017561] rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                title="Enviar mensaje"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 bg-[#f0f0f0]">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/50 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">WhatsApp Web</p>
              <p className="text-sm mt-2 text-gray-500">Selecciona un chat para comenzar</p>
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

      {/* Assign Conversation Modal */}
      {showAssignModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Asignar Conversación</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedConversation.participantName || selectedConversation.phoneNumber}
            </p>
            
            {/* Asignación actual */}
            {currentAssignment ? (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      📌 Asignado actualmente a:
                    </p>
                    <p className="font-medium text-gray-900">{currentAssignment.advisorName}</p>
                    <p className="text-sm text-gray-600">{currentAssignment.advisorEmail}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Asignado por: {currentAssignment.assignedByName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(currentAssignment.assignedAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUnassignConversation}
                  disabled={loading}
                  className="mt-3 w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm font-medium"
                >
                  🗑️ Desasignar
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  ℹ️ Esta conversación no está asignada a ningún asesor
                </p>
              </div>
            )}
            
            {/* Lista de asesores */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {currentAssignment ? 'Reasignar a:' : 'Asignar a:'}
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {advisors.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No hay asesores disponibles</p>
                ) : (
                  advisors.map((advisor) => {
                    const isCurrentlyAssigned = currentAssignment?.userId === advisor.userId;
                    return (
                      <button
                        key={advisor.userId}
                        onClick={() => !isCurrentlyAssigned && handleAssignConversation(advisor.userId)}
                        disabled={loading || isCurrentlyAssigned}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                          isCurrentlyAssigned
                            ? 'bg-blue-100 border-blue-300 cursor-not-allowed'
                            : 'border-gray-200 hover:bg-green-50 hover:border-green-300'
                        } disabled:opacity-50`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{advisor.name}</div>
                            <div className="text-sm text-gray-500">{advisor.email}</div>
                          </div>
                          {isCurrentlyAssigned && (
                            <span className="text-xs text-blue-600 font-semibold">Actual</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowAssignModal(false);
                setCurrentAssignment(null);
              }}
              disabled={loading}
              className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
            >
              Cerrar
            </button>
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
      
      {/* WhatsApp Template Modal */}
      {showTemplateModal && selectedConversation && selectedCompany && (
        <WhatsAppTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSend={handleSendTemplate}
          phoneNumberId={selectedCompany.phoneNumberId}
        />
      )}
    </div>
  );
};

export default ConversationsPage;
