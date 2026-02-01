import React from 'react';
import CompanyFlowBuilder from './CompanyFlowBuilder';

interface FlowStep {
  stepId: string;
  fieldName: string;
  question: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select';
  validation: {
    required: boolean;
    type: string;
  };
  errorMessage?: string;
  options?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  dependsOn?: string;
  showWhen?: string;
}

interface FlowBuilderModalProps {
  isOpen: boolean;
  flowSteps: FlowStep[];
  companyName: string;
  onAddStep: (step: FlowStep) => void;
  onUpdateStep: (stepId: string, step: FlowStep) => void;
  onDeleteStep: (stepId: string) => void;
  onClose: () => void;
}

const FlowBuilderModal: React.FC<FlowBuilderModalProps> = ({
  isOpen,
  flowSteps,
  companyName,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold">Editor de Flujo Bot</h2>
            <p className="text-blue-100 text-sm mt-1">Empresa: {companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition text-2xl"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          <CompanyFlowBuilder
            flowSteps={flowSteps}
            onAddStep={onAddStep}
            onUpdateStep={onUpdateStep}
            onDeleteStep={onDeleteStep}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowBuilderModal;
