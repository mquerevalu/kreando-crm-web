import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { conversationService } from '../services/conversationService';
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
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
}

const ConversationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      // Usar pageId en formato whatsapp-{phoneNumberId}
      const pageId = 'whatsapp-1026217640567682'; // TODO: obtener del contexto de la empresa
      const data = await conversationService.getConversations(pageId);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const pageId = 'whatsapp-1026217640567682'; // TODO: obtener del contexto de la empresa

  // Manejar mensajes WebSocket
  const handleWebSocketMessage = useCallback((wsMessage: any) => {
    if (wsMessage.type === 'message') {
      // Nuevo mensaje recibido
      if (selectedConversation && selectedConversation.senderId === wsMessage.senderId) {
        const newMessage: Message = {
          id: `ws-${Date.now()}`,
          sender: wsMessage.data.direction === 'incoming' ? (wsMessage.data.senderName || 'Usuario') : 'Bot',
          content: wsMessage.data.message,
          timestamp: new Date(wsMessage.data.timestamp).toISOString(),
          direction: wsMessage.data.direction === 'incoming' ? 'inbound' : 'outbound',
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } else if (wsMessage.type === 'conversation_update') {
      // Actualizar conversación
      setConversations(prev =>
        prev.map(conv =>
          conv.senderId === wsMessage.senderId
            ? { ...conv, lastMessage: wsMessage.data.lastMessage }
            : conv
        )
      );
    }
  }, [selectedConversation]);

  // Conectar WebSocket
  useWebSocket(pageId, handleWebSocketMessage);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
      // Reload conversations to update last message
      await loadConversations();
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

      // En producción, necesitarías subir el archivo a S3 o similar
      // Por ahora, usamos una URL de ejemplo
      const fileUrl = URL.createObjectURL(file);
      
      console.log(`Sending ${fileType}: ${file.name}`);
      
      await conversationService.sendFile(
        selectedConversation.pageId,
        selectedConversation.senderId,
        fileUrl,
        fileType,
        file.name,
        replyMessage || undefined
      );

      setReplyMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload messages
      const data = await conversationService.getMessages(selectedConversation.pageId, selectedConversation.senderId);
      setMessages(data);
      // Reload conversations to update last message
      await loadConversations();
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

  return (
    <div className="flex h-full bg-gray-100">
      {/* Conversations List - WhatsApp Style */}
      <div className="w-96 bg-white flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
          <h1 className="text-2xl font-bold">Mensajes</h1>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar conversación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
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
                  selectedConversation?.id === conversation.id ? 'bg-gray-100' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(conversation.participantName || conversation.phoneNumber).charAt(0).toUpperCase()}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-gray-900 truncate">
                      {conversation.participantName || conversation.phoneNumber}
                    </p>
                    <p className="text-xs text-gray-500 ml-2 flex-shrink-0">{conversation.lastMessageTime}</p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                </div>

                {/* Unread Badge */}
                {conversation.unreadCount > 0 && (
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {conversation.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Area - WhatsApp Style */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                  {(selectedConversation.participantName || selectedConversation.phoneNumber).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.participantName || selectedConversation.phoneNumber}
                  </h3>
                  <p className="text-xs text-gray-500">En línea</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  🔍
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  ⋮
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
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
                            ? 'bg-green-500 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                        } shadow-sm`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.direction === 'outbound'
                            ? 'text-green-100'
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
                  onKeyPress={(e) => {
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
    </div>
  );
};

export default ConversationsPage;
