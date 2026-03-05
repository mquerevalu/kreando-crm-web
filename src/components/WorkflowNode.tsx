import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface WorkflowNodeProps {
  data: {
    label: string;
    type: string;
    fieldName: string;
    isConditional: boolean;
    onClick: () => void;
    onDelete: () => void;
    isSelected?: boolean;
  };
}

const getTypeConfig = (type: string) => {
  const configs: Record<string, { icon: string; color: string }> = {
    text: { icon: '📝', color: '#3b82f6' },
    email: { icon: '📧', color: '#8b5cf6' },
    phone: { icon: '📱', color: '#ec4899' },
    number: { icon: '🔢', color: '#f59e0b' },
    select: { icon: '📋', color: '#10b981' },
  };
  return configs[type] || { icon: '❓', color: '#6b7280' };
};

const WorkflowNode: React.FC<WorkflowNodeProps> = ({ data }) => {
  const config = getTypeConfig(data.type);
  
  // Truncar texto
  const truncate = (text: string, max: number = 50) => {
    return text.length > max ? text.substring(0, max) + '...' : text;
  };
  
  return (
    <div
      onClick={data.onClick}
      className={`relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer group border-2 ${
        data.isSelected ? 'border-blue-500' : 'border-gray-200'
      }`}
      style={{ width: '200px', minHeight: '90px' }}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        id="target"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      
      {/* Header */}
      <div 
        className="px-3 py-1.5 rounded-t-lg flex items-center gap-2"
        style={{ backgroundColor: config.color }}
      >
        <span className="text-base">{config.icon}</span>
        <span className="text-xs font-semibold text-white uppercase">
          {data.type}
        </span>
        {data.isConditional && (
          <span className="ml-auto text-xs">⚡</span>
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <div className="text-xs font-medium text-gray-700 mb-1">
          {truncate(data.label, 50)}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {data.fieldName}
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onDelete();
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md opacity-0 group-hover:opacity-100"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <Handle 
        type="source" 
        position={Position.Bottom}
        id="source"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
};

export default WorkflowNode;
