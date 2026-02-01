import React from 'react';
import { FlowStep } from '../types/index';

interface StepListProps {
  steps: FlowStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
}

const getStepIcon = (type: string) => {
  const icons: Record<string, string> = {
    text: '📝',
    email: '📧',
    phone: '📱',
    number: '🔢',
    select: '📋',
  };
  return icons[type] || '❓';
};

const StepList: React.FC<StepListProps> = ({ steps, selectedStepId, onSelectStep, onDeleteStep }) => {
  return (
    <div className="p-4 space-y-2">
      {steps.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No hay pasos aún</p>
      ) : (
        steps.map((step, index) => (
          <div
            key={step.stepId}
            onClick={() => onSelectStep(step.stepId)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition ${
              selectedStepId === step.stepId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStepIcon(step.type)}</span>
                  <span className="font-semibold text-gray-900 text-sm">Paso {index + 1}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{step.question}</p>
                <p className="text-xs text-gray-500 mt-1">Campo: {step.fieldName}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStep(step.stepId);
                }}
                className="text-red-600 hover:text-red-800 text-lg ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default StepList;
