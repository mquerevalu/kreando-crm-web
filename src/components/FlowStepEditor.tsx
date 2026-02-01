import React, { useState } from 'react';

export interface FlowStep {
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

interface FlowStepEditorProps {
  step?: FlowStep;
  onSave: (step: FlowStep) => void;
  onCancel: () => void;
}

const STEP_TYPES = [
  { value: 'text', label: 'Texto', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Teléfono', icon: '📱' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'select', label: 'Selección', icon: '📋' },
];

const FlowStepEditor: React.FC<FlowStepEditorProps> = ({ step, onSave, onCancel }) => {
  const [stepId, setStepId] = useState(step?.stepId || `step-${Date.now()}`);
  const [fieldName, setFieldName] = useState(step?.fieldName || '');
  const [question, setQuestion] = useState(step?.question || '');
  const [type, setType] = useState<'text' | 'email' | 'phone' | 'number' | 'select'>(step?.type || 'text');
  const [errorMessage, setErrorMessage] = useState(step?.errorMessage || '');
  const [options, setOptions] = useState(step?.options || []);
  const [dependsOn, setDependsOn] = useState(step?.dependsOn || '');
  const [showWhen, setShowWhen] = useState(step?.showWhen || '');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  const handleAddOption = () => {
    if (newOptionLabel && newOptionValue) {
      setOptions([
        ...options,
        {
          id: `opt-${Date.now()}`,
          label: newOptionLabel,
          value: newOptionValue,
        },
      ]);
      setNewOptionLabel('');
      setNewOptionValue('');
    }
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter(o => o.id !== id));
  };

  const handleSave = () => {
    if (!fieldName || !question) {
      alert('Por favor completa el nombre del campo y la pregunta');
      return;
    }

    if (type === 'select' && options.length === 0) {
      alert('Debes agregar al menos una opción para campos de selección');
      return;
    }

    const newStep: FlowStep = {
      stepId,
      fieldName,
      question,
      type,
      validation: {
        required: true,
        type: type === 'email' ? 'email' : type === 'phone' ? 'phone' : type === 'number' ? 'number' : type === 'select' ? 'text' : 'text',
      },
      ...(errorMessage && { errorMessage }),
      ...(options.length > 0 && { options }),
      ...(dependsOn && { dependsOn }),
      ...(showWhen && { showWhen }),
    };

    onSave(newStep);
  };

  return (
    <div className="space-y-4">
      {/* Step Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Paso</label>
        <div className="grid grid-cols-5 gap-2">
          {STEP_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value as any)}
              className={`p-2 rounded-lg border-2 transition text-center text-xs ${
                type === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-1">{t.icon}</div>
              <div className="font-medium text-gray-900">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Field Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Campo</label>
        <input
          type="text"
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          placeholder="ej: nombre, email, telefono"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Pregunta</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="¿Cuál es tu nombre?"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Error Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje de Error (Opcional)</label>
        <input
          type="text"
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
          placeholder="Por favor ingresa un valor válido"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Options for Select Type */}
      {type === 'select' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Opciones</label>
          
          {/* Add Option Form */}
          <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              placeholder="Etiqueta (ej: Doméstico)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.target.value)}
              placeholder="Valor (ej: domestico)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleAddOption}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
            >
              + Agregar Opción
            </button>
          </div>

          {/* Options List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {options.map((opt) => (
              <div key={opt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.value}</p>
                </div>
                <button
                  onClick={() => handleRemoveOption(opt.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditional Logic */}
      <div className="border-t pt-3">
        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Lógica Condicional (Opcional)</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Depende de</label>
            <input
              type="text"
              value={dependsOn}
              onChange={(e) => setDependsOn(e.target.value)}
              placeholder="ej: tipoNegocio"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mostrar cuando sea</label>
            <input
              type="text"
              value={showWhen}
              onChange={(e) => setShowWhen(e.target.value)}
              placeholder="ej: domestico"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-3 border-t">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          {step ? 'Actualizar' : 'Agregar'} Paso
        </button>
      </div>
    </div>
  );
};

export default FlowStepEditor;
