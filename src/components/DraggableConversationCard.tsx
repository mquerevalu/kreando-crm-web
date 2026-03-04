import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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

interface DraggableConversationCardProps {
  conversation: Conversation;
  onClick: () => void;
  onViewDetail: (e: React.MouseEvent) => void;
  onToggleCRM: (e: React.MouseEvent) => void;
  onViewHistory: (e: React.MouseEvent) => void;
}

const DraggableConversationCard: React.FC<DraggableConversationCardProps> = ({ 
  conversation, 
  onClick, 
  onViewDetail,
  onToggleCRM,
  onViewHistory
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conversation.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 hover:border-blue-300 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Área draggable - solo el header */}
      <div 
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {(conversation.participantName || conversation.phoneNumber).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {conversation.participantName || 'Sin nombre'}
            </p>
            <p className="text-xs text-gray-500">{conversation.phoneNumber}</p>
          </div>
          {conversation.unreadCount && conversation.unreadCount > 0 && (
            <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Contenido no draggable - clickeable para abrir modal */}
      <div onClick={onClick} className="cursor-pointer">
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {conversation.lastMessage}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {conversation.lastMessageTime}
          </p>
          
          {/* Badge CRM */}
          {conversation.crmIntegrated && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              CRM
            </span>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onViewDetail}
          className="flex-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-medium flex items-center justify-center gap-1"
          title="Ver conversación completa"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat
        </button>
        <button
          onClick={onViewHistory}
          className="px-2 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-xs font-medium flex items-center justify-center gap-1"
          title="Ver historial de cambios"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          onClick={onToggleCRM}
          className={`px-2 py-1.5 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1 ${
            conversation.crmIntegrated
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={conversation.crmIntegrated ? 'Desmarcar integración CRM' : 'Marcar como integrado en CRM'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {conversation.crmIntegrated ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DraggableConversationCard;
