import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import WorkflowNode from './WorkflowNode';
import FlowStepEditor from './FlowStepEditor';

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
  const [connections, setConnections] = useState<Array<{ source: string; target: string }>>([]);

  // Sincronizar flowSteps con React Flow
  useEffect(() => {
    const flowNodes: Node[] = flowSteps.map((step, index) => {
      const colors: Record<string, string> = {
        text: '#3b82f6',
        email: '#8b5cf6',
        phone: '#ec4899',
        number: '#f59e0b',
        select: '#10b981',
      };

      return {
        id: step.stepId,
        data: {
          label: step.question,
          type: step.type,
          fieldName: step.fieldName,
          isConditional: !!step.dependsOn,
        },
        position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 200 },
        type: 'step',
        style: {
          background: colors[step.type],
          color: 'white',
          border: selectedStepId === step.stepId ? '3px solid #000' : '2px solid #333',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          minWidth: '150px',
          textAlign: 'center',
          cursor: 'pointer',
        },
      };
    });

    setNodes(flowNodes);
  }, [flowSteps, selectedStepId, setNodes]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedStepId(nodeId);
    setShowNewStepForm(false);
  };

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newConnection = { source: connection.source, target: connection.target };
        const newConnections = [...connections, newConnection];
        setConnections(newConnections);
        
        // Notificar al padre sobre los cambios
        if (onConnectionsChange) {
          onConnectionsChange(newConnections);
        }

        // Agregar la arista visualmente
        const newEdge: Edge = {
          id: `edge-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [connections, onConnectionsChange]
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
          <p className="text-sm text-gray-600 mt-1">Total: {flowSteps.length} pasos</p>
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
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Cómo conectar pasos:</p>
          <p>Arrastra desde el punto inferior de un paso al punto superior de otro para crear una conexión.</p>
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
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
        </div>
      </div>
    </div>
  );
};

export default CompanyFlowBuilder;
