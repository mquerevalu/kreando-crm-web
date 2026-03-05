import React, { useState, useEffect } from 'react';
import { WhatsAppTemplate, whatsappTemplateService } from '../services/whatsappTemplateService';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (templateName: string, languageCode: string, components: any[]) => void;
  phoneNumberId: string;
}

const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  onSend,
  phoneNumberId,
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [headerVars, setHeaderVars] = useState<string[]>([]);
  const [bodyVars, setBodyVars] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'fill'>('select');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await whatsappTemplateService.getTemplates(phoneNumberId);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    const vars = whatsappTemplateService.extractVariables(template);
    
    // Inicializar arrays de variables
    setHeaderVars(Array(vars.header).fill(''));
    setBodyVars(Array(vars.body).fill(''));
    
    // Si no hay variables, enviar directamente
    if (vars.header === 0 && vars.body === 0) {
      handleSend(template, [], []);
    } else {
      setStep('fill');
    }
  };

  const handleSend = (template: WhatsAppTemplate, header: string[], body: string[]) => {
    const components = whatsappTemplateService.buildComponents(template, header, body);
    onSend(template.name, template.language, components);
    handleClose();
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setHeaderVars([]);
    setBodyVars([]);
    setStep('select');
    onClose();
  };

  const getTemplatePreview = (template: WhatsAppTemplate) => {
    const bodyComponent = template.components.find(c => c.type === 'BODY');
    return bodyComponent?.text || 'Sin vista previa';
  };

  const canSubmit = () => {
    const allHeaderFilled = headerVars.every(v => v.trim() !== '');
    const allBodyFilled = bodyVars.every(v => v.trim() !== '');
    return allHeaderFilled && allBodyFilled;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {step === 'select' ? 'Seleccionar Plantilla' : 'Completar Variables'}
              </h2>
              <p className="text-green-100 text-sm mt-1">
                {step === 'select' 
                  ? 'Elige una plantilla aprobada para enviar' 
                  : 'Completa las variables de la plantilla'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : step === 'select' ? (
            // Lista de plantillas
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium">No hay plantillas disponibles</p>
                  <p className="text-sm mt-1">Crea plantillas en el administrador de WhatsApp Business</p>
                </div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {getTemplatePreview(template)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {template.language}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {template.category}
                          </span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            // Formulario de variables
            selectedTemplate && (
              <div className="space-y-6">
                {/* Vista previa de la plantilla */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Vista previa</h3>
                  {selectedTemplate.components.map((component, idx) => (
                    <div key={idx} className="mb-2">
                      {component.type === 'HEADER' && component.text && (
                        <p className="font-bold text-gray-900">{component.text}</p>
                      )}
                      {component.type === 'BODY' && component.text && (
                        <p className="text-gray-700 whitespace-pre-wrap">{component.text}</p>
                      )}
                      {component.type === 'FOOTER' && component.text && (
                        <p className="text-sm text-gray-500 mt-2">{component.text}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Variables del header */}
                {headerVars.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Variables del encabezado</h3>
                    <div className="space-y-3">
                      {headerVars.map((value, idx) => (
                        <div key={idx}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Variable {idx + 1}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newVars = [...headerVars];
                              newVars[idx] = e.target.value;
                              setHeaderVars(newVars);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder={`Ingresa el valor para {{${idx + 1}}}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variables del cuerpo */}
                {bodyVars.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Variables del mensaje</h3>
                    <div className="space-y-3">
                      {bodyVars.map((value, idx) => (
                        <div key={idx}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Variable {idx + 1}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newVars = [...bodyVars];
                              newVars[idx] = e.target.value;
                              setBodyVars(newVars);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder={`Ingresa el valor para {{${idx + 1}}}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        {step === 'fill' && selectedTemplate && (
          <div className="border-t border-gray-200 p-4 flex justify-between">
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              ← Volver
            </button>
            <button
              onClick={() => handleSend(selectedTemplate, headerVars, bodyVars)}
              disabled={!canSubmit()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar Plantilla
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppTemplateModal;
