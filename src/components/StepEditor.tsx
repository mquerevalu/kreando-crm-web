import React, { useState, useEffect } from 'react';
import { FlowStep, StepType, StepOption, ValidationRule } from '../types/index';

interface StepEditorProps {
  step?: FlowStep;
  onSave: (step: FlowStep) => void;
  onCancel: () => void;
  stepCount?: number;
}

const STEP_TYPES: { value: StepType; label: string; icon: string }[] = [
  { value: 'text', label: 'Texto', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Teléfono', icon: '📱' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'select', label: 'Selección', icon: '📋' },
];

const StepEditor: React.FC<StepEditorProps> = ({ step, onSave, onCancel, stepCount = 0 }) => {
  const [stepId, setStepId] = useState(step?.stepId || `step-${Date.now()}`);
  const [fieldName, setFieldName] = useState(step?.fieldName || '');
  const [question, setQuestion] = useState(step?.question || '');
  const [type, setType] = useState<StepType>(step?.type || 'text');
  const [errorMessage, setErrorMessage] = useState(step?.errorMessage || '');
  const [options, setOptions] = useState<StepOption[]>(step?.options || []);
  const [dependsOn, setDependsOn] = useState(step?.dependsOn || '');
  const [showWhen, setShowWhen] = useState(step?.showWhen || '');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!fieldName || !question) {
      alert('Por favor completa el nombre del campo y la pregunta');
      return;
    }

    if (type === 'select' && options.length === 0) {
      alert('Debes agregar al menos una opción para campos de selección');
      return;
    }

    setIsSaving(true);

    const validation: ValidationRule = {
      required: true,
      type: type === 'email' ? 'email' : type === 'phone' ? 'phone' : type === 'number' ? 'number' : type === 'select' ? 'select' : 'text',
    };

    const newStep: FlowStep = {
      stepId,
      fieldName,
      question,
      type,
      validation,
      ...(errorMessage && { errorMessage }),
      ...(options.length > 0 && { options }),
      ...(dependsOn && { dependsOn }),
      ...(showWhen && { showWhen }),
    };

    // Simular guardado con delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log('%c[STEP SAVED]', 'color: #00aa00; font-weight: bold; font-size: 14px;');
    console.log('%cStep Data:', 'color: #666; font-weight: bold;', JSON.stringify(newStep, null, 2));

    setIsSaving(false);
    onSave(newStep);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Step Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Tipo de Paso</label>
        <div className="grid grid-cols-5 gap-2">
          {STEP_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              disabled={isSaving}
              className={`p-3 rounded-lg border-2 transition text-center ${
                type === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs font-medium text-gray-900">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Field Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre del Campo</label>
        <input
          type="text"
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          disabled={isSaving}
          placeholder="ej: nombre, email, telefono"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500 mt-1">Este será el nombre de la variable guardada</p>
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Pregunta</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isSaving}
          placeholder="¿Cuál es tu nombre?"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* Error Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Mensaje de Error (Opcional)</label>
        <input
          type="text"
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
          disabled={isSaving}
          placeholder="Por favor ingresa un valor válido"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* Options for Select Type */}
      {type === 'select' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Opciones</label>
          
          {/* Add Option Form */}
          <div className="space-y-2 mb-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              disabled={isSaving}
              placeholder="Etiqueta (ej: Doméstico)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <input
              type="text"
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.target.value)}
              disabled={isSaving}
              placeholder="Valor (ej: domestico)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <button
              onClick={handleAddOption}
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              + Agregar Opción
            </button>
          </div>

          {/* Options List */}
          <div className="space-y-2">
            {options.map((opt) => (
              <div key={opt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.value}</p>
                </div>
                <button
                  onClick={() => handleRemoveOption(opt.id)}
                  disabled={isSaving}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditional Logic */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">Lógica Condicional (Opcional)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depende de</label>
            <input
              type="text"
              value={dependsOn}
              onChange={(e) => setDependsOn(e.target.value)}
              disabled={isSaving}
              placeholder="ej: tipoNegocio"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Campo del que depende esta pregunta</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mostrar cuando sea</label>
            <input
              type="text"
              value={showWhen}
              onChange={(e) => setShowWhen(e.target.value)}
              disabled={isSaving}
              placeholder="ej: domestico"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Valor que debe tener el campo dependiente</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="animate-spin">⏳</span>
              Guardando...
            </>
          ) : (
            `${step ? 'Actualizar' : 'Crear'} Paso`
          )}
        </button>
      </div>
    </div>
  );
};

export default StepEditor;
