import React, { useEffect, useState, useCallback } from 'react';
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
import WorkflowNode from './WorkflowNode';
import FlowStepEditor from './FlowStepEditor';
import { 
  convertToReactFlowFormat, 
  calculateHierarchicalLayout 
} from '../utils/workflowConverter';

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

interface CompanyFlowBuilderProps {
  flowSteps: FlowStep[];
  onAddStep: (step: FlowStep) => void;
  onUpdateStep: (stepId: string, step: FlowStep) => void;
  onDeleteStep: (stepId: string) => void;
  onConnectionsChange?: (connections: Array<{ source: string; target: string }>) => void;
}

const nodeTypes: NodeTypes = {
  step: WorkflowNode,
};

const CompanyFlowBuilder: React.FC<CompanyFlowBuilderProps> = ({
  flowSteps,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onConnectionsChange,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showNewStepForm, setShowNewStepForm] = useState(false);

  // Sincronizar flowSteps con React Flow usando el converter
  useEffect(() => {
    console.log('========================================');
    console.log('🔄 CompanyFlowBuilder - Syncing flowSteps');
    console.log('📊 flowSteps:', flowSteps);
    console.log('========================================');

    if (!flowSteps || flowSteps.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Convertir formato BD a ReactFlow
    const { steps, connections } = convertToReactFlowFormat(flowSteps);
    
    console.log('✅ Conversion complete:', {
      steps: steps.length,
      connections: connections.length,
    });

    // Calcular posiciones con layout jerárquico
    const positions = calculateHierarchicalLayout(steps, connections);

    // Crear nodos de ReactFlow
    const flowNodes: Node[] = steps.map((step) => ({
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
    }));

    // Crear edges de ReactFlow
    const flowEdges: Edge[] = connections.map((conn) => ({
      id: conn.id,
      source: conn.sourceStepId,
      target: conn.targetStepId,
      label: conn.label || conn.condition || '',
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#94a3b8', 
        strokeWidth: 2 
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
        width: 20,
        height: 20,
      },
      labelStyle: {
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#ffffff',
      },
    }));

    console.log('🎨 ReactFlow elements created:');
    console.log('  - Nodes:', flowNodes.length);
    console.log('  - Edges:', flowEdges.length);
    console.log('========================================');

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowSteps, selectedStepId, setNodes, setEdges]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedStepId(nodeId);
    setShowNewStepForm(false);
  };

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        console.log('🔗 New connection:', connection);
        
        // Notificar al padre sobre los cambios
        if (onConnectionsChange) {
          onConnectionsChange([{ source: connection.source, target: connection.target }]);
        }
      }
    },
    [onConnectionsChange]
  );

  const handleAddStep = (step: FlowStep) => {
    onAddStep(step);
    setShowNewStepForm(false);
  };

  const handleUpdateStep = (stepId: string, updates: FlowStep) => {
    onUpdateStep(stepId, updates);
    setSelectedStepId(null);
  };

  const handleDeleteStep = (stepId: string) => {
    onDeleteStep(stepId);
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  const selectedStep = flowSteps.find(s => s.stepId === selectedStepId);

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Editor */}
      <div className="w-96 bg-gray-50 rounded-lg border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="font-bold text-lg text-gray-900">Pasos del Flujo</h3>
          <p className="text-sm text-gray-600 mt-1">
            {flowSteps.length} pasos • {edges.length} conexiones
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {showNewStepForm ? (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3">Crear Nuevo Paso</h4>
              <FlowStepEditor
                onSave={handleAddStep}
                onCancel={() => setShowNewStepForm(false)}
              />
            </div>
          ) : selectedStep ? (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Editar Paso</h4>
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que deseas eliminar este paso?')) {
                      handleDeleteStep(selectedStep.stepId);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition"
                >
                  🗑️ Eliminar
                </button>
              </div>
              <FlowStepEditor
                step={selectedStep}
                onSave={(step) => handleUpdateStep(selectedStep.stepId, step)}
                onCancel={() => setSelectedStepId(null)}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Selecciona un paso en el canvas</p>
              <p className="text-xs mt-2">o crea uno nuevo</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => {
              setShowNewStepForm(true);
              setSelectedStepId(null);
            }}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Agregar Paso
          </button>
        </div>
      </div>

      {/* Right Panel - Canvas */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        {/* Instructions */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-800">
          <p><span className="font-semibold">💡 Tip:</span> Los conectores se generan automáticamente desde los campos "dependsOn" y "showWhen"</p>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
        {flowSteps.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🔄</div>
              <p className="text-lg">No hay pasos configurados</p>
              <p className="text-sm mt-2">Crea el primer paso para comenzar</p>
            </div>
          </div>
        ) : (
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
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
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
        )}
        </div>
      </div>
    </div>
  );
};

export default CompanyFlowBuilder;
