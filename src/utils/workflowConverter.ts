import { FlowStep, WorkflowConnection } from '../types/index';

/**
 * Convierte el formato de BD (dependsOn/showWhen) a formato ReactFlow (connections)
 */
export const convertToReactFlowFormat = (steps: FlowStep[]): {
  steps: FlowStep[];
  connections: WorkflowConnection[];
} => {
  if (!steps || steps.length === 0) {
    console.warn('⚠️ No steps provided to convert');
    return { steps: [], connections: [] };
  }

  console.log('🔧 convertToReactFlowFormat - Input steps:', steps.length);
  console.log('🔧 Steps data:', JSON.stringify(steps, null, 2));
  
  // Asegurar IDs únicos
  const stepsWithUniqueIds = steps.map((step, index) => {
    const existingIds = steps.slice(0, index).map(s => s.stepId);
    
    if (existingIds.includes(step.stepId)) {
      const newStepId = `${step.stepId}-${step.fieldName}`;
      console.warn(`⚠️ Duplicate stepId found: ${step.stepId}, changing to: ${newStepId}`);
      return { ...step, stepId: newStepId };
    }
    return step;
  });

  console.log('🔧 Steps with unique IDs:', stepsWithUniqueIds.map(s => ({ 
    stepId: s.stepId, 
    fieldName: s.fieldName, 
    dependsOn: s.dependsOn,
    showWhen: s.showWhen 
  })));

  // Generar conexiones desde dependsOn
  const connections: WorkflowConnection[] = [];
  
  stepsWithUniqueIds.forEach(step => {
    console.log(`🔍 Checking step ${step.stepId} (${step.fieldName}):`, {
      hasDependsOn: !!step.dependsOn,
      dependsOn: step.dependsOn,
      showWhen: step.showWhen,
    });
    
    if (step.dependsOn) {
      const parentStep = stepsWithUniqueIds.find(s => s.fieldName === step.dependsOn);
      console.log(`  🔗 Looking for parent with fieldName="${step.dependsOn}":`, parentStep ? `Found: ${parentStep.stepId}` : 'NOT FOUND');
      
      if (parentStep) {
        const connection = {
          id: `conn-${parentStep.stepId}-${step.stepId}`,
          sourceStepId: parentStep.stepId,
          targetStepId: step.stepId,
          label: step.showWhen || '',
          condition: step.showWhen,
        };
        console.log(`  ✅ Created connection:`, connection);
        connections.push(connection);
      }
    }
  });

  console.log('🔧 Total connections created:', connections.length);
  console.log('🔧 Connections:', JSON.stringify(connections, null, 2));

  return {
    steps: stepsWithUniqueIds,
    connections,
  };
};

/**
 * Convierte el formato ReactFlow (connections) de vuelta al formato de BD (dependsOn/showWhen)
 */
export const convertFromReactFlowFormat = (
  steps: FlowStep[],
  connections: WorkflowConnection[]
): FlowStep[] => {
  // Crear un mapa de conexiones por targetStepId
  const connectionMap = new Map<string, WorkflowConnection>();
  connections.forEach(conn => {
    connectionMap.set(conn.targetStepId, conn);
  });

  // Actualizar steps con dependsOn y showWhen
  return steps.map(step => {
    const connection = connectionMap.get(step.stepId);
    
    if (connection) {
      const sourceStep = steps.find(s => s.stepId === connection.sourceStepId);
      if (sourceStep) {
        return {
          ...step,
          dependsOn: sourceStep.fieldName,
          showWhen: connection.condition || connection.label || undefined,
        };
      }
    }
    
    // Si no tiene conexión entrante, no tiene dependsOn
    return {
      ...step,
      dependsOn: undefined,
      showWhen: undefined,
    };
  });
};

/**
 * Calcula el layout jerárquico para los nodos
 */
export const calculateHierarchicalLayout = (
  steps: FlowStep[],
  connections: WorkflowConnection[]
): Record<string, { x: number; y: number }> => {
  if (steps.length === 0) return {};

  console.log('📐 Calculating layout for', steps.length, 'steps and', connections.length, 'connections');

  const positions: Record<string, { x: number; y: number }> = {};
  const levels: Record<string, number> = {};
  const visited = new Set<string>();

  // Build adjacency lists
  const outgoing: Record<string, string[]> = {};
  const incoming: Record<string, string[]> = {};

  steps.forEach(s => {
    outgoing[s.stepId] = [];
    incoming[s.stepId] = [];
  });

  connections.forEach(c => {
    if (outgoing[c.sourceStepId]) {
      outgoing[c.sourceStepId].push(c.targetStepId);
    }
    if (incoming[c.targetStepId]) {
      incoming[c.targetStepId].push(c.sourceStepId);
    }
  });

  console.log('📐 Adjacency lists:', { outgoing, incoming });

  // Find root nodes (no incoming connections)
  const roots = steps.filter(s => incoming[s.stepId].length === 0);
  console.log('📐 Root nodes:', roots.map(r => r.stepId));

  // If no roots found, use first step
  if (roots.length === 0 && steps.length > 0) {
    roots.push(steps[0]);
    console.log('📐 No roots found, using first step:', steps[0].stepId);
  }

  // BFS to assign levels
  const queue: { stepId: string; level: number }[] = roots.map(s => ({
    stepId: s.stepId,
    level: 0,
  }));
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
      console.log('📐 Unvisited node:', s.stepId, 'assigned to level', maxLevel + 1);
    }
  });

  console.log('📐 Levels assigned:', levels);

  // Group by level
  const levelGroups: Record<number, string[]> = {};
  Object.entries(levels).forEach(([stepId, level]) => {
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(stepId);
  });

  console.log('📐 Level groups:', levelGroups);

  // Calculate positions with better spacing
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 90;
  const HORIZONTAL_SPACING = 150;
  const VERTICAL_SPACING = 100;

  Object.entries(levelGroups).forEach(([level, stepIds]) => {
    const levelNum = parseInt(level);
    const y = levelNum * (NODE_HEIGHT + VERTICAL_SPACING);

    // Center nodes horizontally
    const totalWidth =
      stepIds.length * NODE_WIDTH + (stepIds.length - 1) * HORIZONTAL_SPACING;
    const startX = -totalWidth / 2 + NODE_WIDTH / 2;

    stepIds.forEach((stepId, index) => {
      positions[stepId] = {
        x: startX + index * (NODE_WIDTH + HORIZONTAL_SPACING),
        y: y,
      };
    });
  });

  console.log('📐 Final positions:', positions);

  return positions;
};
