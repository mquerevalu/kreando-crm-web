// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Validation Types
export interface ValidationRule {
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'number' | 'select';
  pattern?: string;
}

// Step Types
export type StepType = 'text' | 'select' | 'email' | 'phone' | 'number';

export interface StepOption {
  id: string;
  label: string;
  value: string;
}

export interface FlowStep {
  stepId: string;
  fieldName: string;
  type: StepType;
  question: string;
  validation: ValidationRule;
  options?: StepOption[];
  errorMessage?: string;
  dependsOn?: string;
  showWhen?: string;
}

// Workflow Connection (para el flujo visual)
export interface WorkflowConnection {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  condition?: string; // Para conexiones condicionales
  label?: string;
}

// Workflow Types
export interface Workflow {
  id: string;
  companyId: string;
  name: string;
  description: string;
  flujoBot: FlowStep[];
  connections?: WorkflowConnection[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Conversation Types
export interface ConversationState {
  senderId: string;
  companyId: string;
  workflowId: string;
  currentStepIndex: number;
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  direction: 'incoming' | 'outgoing';
  text: string;
  timestamp: string;
}
