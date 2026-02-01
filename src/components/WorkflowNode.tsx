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
  };
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    text: '📝',
    email: '📧',
    phone: '📱',
    number: '🔢',
    select: '📋',
  };
  return icons[type] || '❓';
};

const WorkflowNode: React.FC<WorkflowNodeProps> = ({ data }) => {
  return (
    <div
      onClick={data.onClick}
      className="relative w-full h-full flex flex-col items-center justify-center p-2 cursor-pointer hover:shadow-lg transition"
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="text-2xl mb-1">{getTypeIcon(data.type)}</div>
      
      <div className="text-xs font-bold text-center line-clamp-3 mb-1">
        {data.label}
      </div>
      
      <div className="text-xs opacity-75 text-center">
        {data.fieldName}
      </div>

      {data.isConditional && (
        <div className="absolute top-1 right-1 text-xs bg-yellow-300 text-yellow-900 px-1 rounded">
          ⚡
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onDelete();
        }}
        className="absolute top-1 left-1 text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-700 transition"
      >
        ✕
      </button>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default WorkflowNode;
