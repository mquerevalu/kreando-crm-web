import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../store/workflowStore';
import { FlowStep, WorkflowConnection, StepType } from '../types/index';
import StepEditor from '../components/StepEditor';
import WorkflowNode from '../components/WorkflowNode';
import {
  convertToReactFlowFormat,
  convertFromReactFlowFormat,
  calculateHierarchicalLayout,
} from '../utils/workflowConverter';

const nodeTypes: NodeTypes = {
  step: WorkflowNode,
};

const STEP_TYPE_TEMPLATES: { type: StepType; icon: string; label: string; color: string }[] = [
  { type: 'text', icon: '📝', label: 'Texto', color: '#3b82f6' },
  { type: 'email', icon: '📧', label: 'Email', color: '#8b5cf6' },
  { type: 'phone', icon: '📱', label: 'Teléfono', color: '#ec4899' },
  { type: 'number', icon: '🔢', label: 'Número', color: '#f59e0b' },
  { type: 'select', icon: '📋', label: 'Selección', color: '#10b981' },
];

// Auto-layout algorithm - Improved hierarchical layout with implicit connections
const calculateNodePositions = (steps: FlowStep[], connections: WorkflowConnection[]) => {
  if (steps.length === 0) return {};
  
  console.log('🎯 calculateNodePositions called with:', {
    stepsCount: steps.length,
    connectionsCount: connections.length,
    connections: connections.map(c => `${c.sourceStepId} → ${c.targetStepId}`)
  });
  
  const positions: Record<string, { x: number; y: number }> = {};
  const levels: Record<string, number> = {};
  const visited = new Set<string>();
  
  // Build adjacency lists from explicit connections AND implicit dependsOn
  const outgoing: Record<string, string[]> = {};
  const incoming: Record<string, string[]> = {};
  
  steps.forEach(s => {
    outgoing[s.stepId] = [];
    incoming[s.stepId] = [];
  });
  
  // Add explicit connections
  connections.forEach(c => {
    if (outgoing[c.sourceStepId]) {
      outgoing[c.sourceStepId].push(c.targetStepId);
    }
    if (incoming[c.targetStepId]) {
      incoming[c.targetStepId].push(c.sourceStepId);
    }
  });
  
  // Add implicit connections from dependsOn field
  steps.forEach(step => {
    if (step.dependsOn) {
      // Find the parent step by fieldName
      const parentStep = steps.find(s => s.fieldName === step.dependsOn);
      if (parentStep) {
        if (!outgoing[parentStep.stepId].includes(step.stepId)) {
          outgoing[parentStep.stepId].push(step.stepId);
        }
        if (!incoming[step.stepId].includes(parentStep.stepId)) {
          incoming[step.stepId].push(parentStep.stepId);
        }
      }
    }
  });
  
  console.log('📊 Adjacency lists:', { outgoing, incoming });
  
  // Find root nodes (no incoming connections)
  const roots = steps.filter(s => incoming[s.stepId].length === 0);
  console.log('🌳 Root nodes:', roots.map(r => r.fieldName));
  
  // If no roots found, use first step
  if (roots.length === 0 && steps.length > 0) {
    roots.push(steps[0]);
  }
  
  // BFS to assign levels
  const queue: { stepId: string; level: number }[] = roots.map(s => ({ stepId: s.stepId, level: 0 }));
  let maxLevel = 0;
  
  while (queue.length > 0) {
    const { stepId, level } = queue.shift()!;
    
    // Skip if already visited with a lower or equal level
    if (visited.has(stepId) && levels[stepId] <= level) continue;
    
    visited.add(stepId);
    levels[stepId] = level;
    maxLevel = Math.max(maxLevel, level);
    
    // Add children to queue
    const children = outgoing[stepId] || [];
    children.forEach(childId => {
      queue.push({ stepId: childId, level: level + 1 });
    });
  }
  
  // Assign unvisited nodes (disconnected) to the end
  steps.forEach(s => {
    if (!visited.has(s.stepId)) {
      levels[s.stepId] = maxLevel + 1;
    }
  });
  
  console.log('📏 Levels assigned:', levels);
  
  // Group by level
  const levelGroups: Record<number, string[]> = {};
  Object.entries(levels).forEach(([stepId, level]) => {
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(stepId);
  });
  
  console.log('📦 Level groups:', levelGroups);
  
  // Calculate positions with better spacing
  const NODE_WIDTH = 250;
  const NODE_HEIGHT = 180;
  const HORIZONTAL_SPACING = 100;
  const VERTICAL_SPACING = 80;
  
  Object.entries(levelGroups).forEach(([level, stepIds]) => {
    const levelNum = parseInt(level);
    const y = levelNum * (NODE_HEIGHT + VERTICAL_SPACING);
    
    // Center nodes horizontally
    const totalWidth = stepIds.length * NODE_WIDTH + (stepIds.length - 1) * HORIZONTAL_SPACING;
    const startX = -totalWidth / 2 + NODE_WIDTH / 2;
    
    stepIds.forEach((stepId, index) => {
      positions[stepId] = {
        x: startX + index * (NODE_WIDTH + HORIZONTAL_SPACING),
        y: y,
      };
    });
  });
  
  return positions;
};

const WorkflowBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkflow, fetchWorkflow, updateWorkflow, saveWorkflow, addStep, deleteStep, updateStep } = useWorkflowStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showNewStepForm, setShowNewStepForm] = useState(false);
  const [newStepType, setNewStepType] = useState<StepType | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorkflow(id);
    }
  }, [id, fetchWorkflow]);

  // Sincronizar workflow con React Flow usando auto-layout
  useEffect(() => {
    if (currentWorkflow) {
      console.log('🔍 DEBUG: Workflow flujoBot:', currentWorkflow.flujoBot);
      
      // FIX: Ensure unique stepIds (some workflows have duplicates)
      const stepsWithUniqueIds = currentWorkflow.flujoBot.map((step, index) => {
        const existingIds = currentWorkflow.flujoBot
          .slice(0, index)
          .map(s => s.stepId);
        
        if (existingIds.includes(step.stepId)) {
          const newStepId = `${step.stepId}-${step.fieldName}`;
          console.warn(`⚠️ Duplicate stepId found: ${step.stepId}, changing to: ${newStepId}`);
          return { ...step, stepId: newStepId };
        }
        return step;
      });
      
      // Generate implicit connections from dependsOn fields
      const implicitConnections: WorkflowConnection[] = [];
      stepsWithUniqueIds.forEach(step => {
        if (step.dependsOn) {
          const parentStep = stepsWithUniqueIds.find(s => s.fieldName === step.dependsOn);
          if (parentStep) {
            const connection = {
              id: `implicit-${parentStep.stepId}-${step.stepId}`,
              sourceStepId: parentStep.stepId,
              targetStepId: step.stepId,
              label: step.showWhen ? `"${step.showWhen}"` : '',
            };
            implicitConnections.push(connection);
            console.log(`🔗 Connection: ${parentStep.fieldName} → ${step.fieldName} (${step.showWhen})`);
          } else {
            console.warn(`⚠️ Parent not found for ${step.fieldName}, dependsOn: ${step.dependsOn}`);
          }
        }
      });
      
      console.log('📊 Total implicit connections:', implicitConnections.length);
      
      // Combine explicit and implicit connections
      const allConnections = [
        ...(currentWorkflow.connections || []),
        ...implicitConnections,
      ];
      
      const positions = calculateNodePositions(stepsWithUniqueIds, allConnections);
      console.log('📍 Calculated positions:', positions);
      
      const flowNodes: Node[] = stepsWithUniqueIds.map((step) => {
        return {
          id: step.stepId,
          data: {
            label: step.question,
            type: step.type,
            fieldName: step.fieldName,
            isConditional: !!step.dependsOn,
            isSelected: selectedStepId === step.stepId,
          },
          position: positions[step.stepId] || { x: 0, y: 0 },
          type: 'step',
        };
      });

      const flowEdges: Edge[] = allConnections.map((conn) => ({
        id: conn.id,
        source: conn.sourceStepId,
        target: conn.targetStepId,
        label: conn.label,
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94a3b8',
        },
      }));

      console.log('🎨 Flow nodes:', flowNodes.length);
      console.log('🔗 Flow edges:', flowEdges.length);

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [currentWorkflow, selectedStepId, setNodes, setEdges]);

  const handleQuickAddStep = (type: StepType) => {
    setNewStepType(type);
    setShowNewStepForm(true);
    setShowQuickAdd(false);
  };

  const handleAddStep = (step: FlowStep) => {
    addStep(step);
    setShowNewStepForm(false);
    setNewStepType(null);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<FlowStep>) => {
    updateStep(stepId, updates);
  };

  const handleDeleteStep = (stepId: string) => {
    deleteStep(stepId);
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedStepId(nodeId);
    setShowNewStepForm(false);
  };

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (currentWorkflow && connection.source && connection.target) {
        const sourceStep = currentWorkflow.flujoBot.find(s => s.stepId === connection.source);
        const targetStep = currentWorkflow.flujoBot.find(s => s.stepId === connection.target);

        if (sourceStep && targetStep) {
          const newConnection: WorkflowConnection = {
            id: `conn-${Date.now()}`,
            sourceStepId: connection.source,
            targetStepId: connection.target,
            label: sourceStep.type === 'select' ? 'Opción' : '',
          };

          const connections = currentWorkflow.connections || [];
          connections.push(newConnection);
          updateWorkflow(currentWorkflow.id, { connections });
        }
      }
    },
    [currentWorkflow, updateWorkflow]
  );

  const handleSave = async () => {
    if (currentWorkflow) {
      setSaveStatus('saving');
      try {
        await saveWorkflow();
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  const handlePublish = async () => {
    if (currentWorkflow) {
      setSaveStatus('saving');
      try {
        await updateWorkflow(currentWorkflow.id, { active: true });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  const handleUnpublish = async () => {
    if (currentWorkflow) {
      setSaveStatus('saving');
      try {
        await updateWorkflow(currentWorkflow.id, { active: false });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  if (!currentWorkflow) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando flujo...</p>
        </div>
      </div>
    );
  }

  const selectedStep = currentWorkflow.flujoBot.find(s => s.stepId === selectedStepId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Editor */}
      <div className="w-96 bg-white shadow-lg flex flex-col overflow-hidden border-r border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="font-bold text-xl text-gray-900">{currentWorkflow.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{currentWorkflow.description}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              currentWorkflow.active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${currentWorkflow.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              {currentWorkflow.active ? 'Activo' : 'Inactivo'}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{currentWorkflow.flujoBot.length}</span>
              <span>pasos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{(currentWorkflow.connections || []).length}</span>
              <span>conexiones</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showNewStepForm ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Crear Nuevo Paso</h3>
                <button
                  onClick={() => {
                    setShowNewStepForm(false);
                    setNewStepType(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <StepEditor
                onSave={handleAddStep}
                onCancel={() => {
                  setShowNewStepForm(false);
                  setNewStepType(null);
                }}
                stepCount={currentWorkflow.flujoBot.length}
              />
            </div>
          ) : selectedStep ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Editar Paso</h3>
                <button
                  onClick={() => setSelectedStepId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <StepEditor
                step={selectedStep}
                onSave={(step) => {
                  handleUpdateStep(selectedStep.stepId, step);
                  setSelectedStepId(null);
                }}
                onCancel={() => setSelectedStepId(null)}
              />
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-1">Selecciona un paso para editar</p>
                <p className="text-xs text-gray-500">o agrega un nuevo paso al flujo</p>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="text-xs font-semibold text-gray-700 mb-3">Resumen del Flujo</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de pasos:</span>
                    <span className="font-semibold text-gray-900">{currentWorkflow.flujoBot.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conexiones:</span>
                    <span className="font-semibold text-gray-900">{(currentWorkflow.connections || []).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pasos condicionales:</span>
                    <span className="font-semibold text-gray-900">
                      {currentWorkflow.flujoBot.filter(s => s.dependsOn).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Quick Add */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {showQuickAdd ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Selecciona tipo de paso:</span>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STEP_TYPE_TEMPLATES.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleQuickAddStep(template.type)}
                    className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition text-center"
                  >
                    <div className="text-2xl mb-1">{template.icon}</div>
                    <div className="text-xs font-medium text-gray-900">{template.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Paso
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:bg-gray-400 flex items-center gap-2 shadow-sm"
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardado
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Guardar
                </>
              )}
            </button>
            {currentWorkflow.active ? (
              <button
                onClick={handleUnpublish}
                disabled={saveStatus === 'saving'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:bg-gray-400 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Desactivar
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={saveStatus === 'saving'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:bg-gray-400 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activar
              </button>
            )}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 bg-gray-50">
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                onClick: () => handleNodeClick(node.id),
                onDelete: () => handleDeleteStep(node.id),
              },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                const type = node.data.type as string;
                const colors: Record<string, string> = {
                  text: '#3b82f6',
                  email: '#8b5cf6',
                  phone: '#ec4899',
                  number: '#f59e0b',
                  select: '#10b981',
                };
                return colors[type] || '#6b7280';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;
