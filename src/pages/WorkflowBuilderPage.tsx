import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useWorkflowStore } from '../store/workflowStore';
import { FlowStep, WorkflowConnection } from '../types/index';
import StepEditor from '../components/StepEditor';
import WorkflowNode from '../components/WorkflowNode';

const nodeTypes: NodeTypes = {
  step: WorkflowNode,
};

const WorkflowBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkflow, fetchWorkflow, updateWorkflow, saveWorkflow, addStep, deleteStep, updateStep } = useWorkflowStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showNewStepForm, setShowNewStepForm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkflow(id);
    }
  }, [id, fetchWorkflow]);

  // Sincronizar workflow con React Flow
  useEffect(() => {
    if (currentWorkflow) {
      const flowNodes: Node[] = currentWorkflow.flujoBot.map((step, index) => {
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

      const flowEdges: Edge[] = (currentWorkflow.connections || []).map((conn) => ({
        id: conn.id,
        source: conn.sourceStepId,
        target: conn.targetStepId,
        label: conn.label,
        animated: true,
        style: { stroke: '#666', strokeWidth: 2 },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [currentWorkflow, selectedStepId, setNodes, setEdges]);

  const handleAddStep = (step: FlowStep) => {
    addStep(step);
    setShowNewStepForm(false);
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
            label: sourceStep.type === 'select' ? 'Opción' : 'Siguiente',
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
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Cargando flujo...</p>
      </div>
    );
  }

  const selectedStep = currentWorkflow.flujoBot.find(s => s.stepId === selectedStepId);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Editor */}
      <div className="w-96 bg-white shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg text-gray-900">{currentWorkflow.name}</h2>
          <p className="text-sm text-gray-600 mt-1">{currentWorkflow.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${currentWorkflow.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-xs font-medium text-gray-600">
              {currentWorkflow.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewStepForm ? (
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Crear Nuevo Paso</h3>
              <StepEditor
                onSave={handleAddStep}
                onCancel={() => setShowNewStepForm(false)}
                stepCount={currentWorkflow.flujoBot.length}
              />
            </div>
          ) : selectedStep ? (
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Editar Paso</h3>
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
            <div className="p-4 text-center text-gray-500 text-sm">
              <p>Selecciona un paso en el canvas para editar</p>
              <p className="mt-2 text-xs">Total de pasos: {currentWorkflow.flujoBot.length}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t space-y-2">
          <button
            onClick={() => setShowNewStepForm(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Agregar Paso
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:bg-gray-400 flex items-center gap-2"
            >
              {saveStatus === 'saving' ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <span>✓</span>
                  Guardado
                </>
              ) : (
                <>
                  <span>💾</span>
                  Guardar
                </>
              )}
            </button>
            {currentWorkflow.active ? (
              <button
                onClick={handleUnpublish}
                disabled={saveStatus === 'saving'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:bg-gray-400"
              >
                ⏹ Desactivar
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={saveStatus === 'saving'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:bg-gray-400"
              >
                ▶ Activar
              </button>
            )}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Volver
          </button>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1">
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
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;
