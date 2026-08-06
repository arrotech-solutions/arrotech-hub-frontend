export interface WorkflowStep {
  id: string;
  step_number: number;
  tool_name: string;
  tool_parameters: Record<string, any>;
  description: string;
  condition?: any;
  retry_config?: { max_retries: number; retry_delay: number };
  timeout?: number;
  /** Parallel branch key when under a router (true/false/default/custom) */
  branch_key?: string;
}

export type TriggerType = 'manual' | 'scheduled' | 'webhook' | 'event';

export interface CanvasState {
  workflowName: string;
  description: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  category: string;
  tags: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  /** When set, canvas/form save should UPDATE this workflow instead of creating */
  workflowId?: string;
}

export type ConnectionChipStatus = 'connected' | 'needs_connect' | 'unknown' | null;

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failed';

export interface WorkflowNodeData {
  label: string;
  toolName: string;
  category: string;
  description: string;
  stepNumber: number;
  isConfigured: boolean;
  isTrigger?: boolean;
  triggerType?: string;
  parameters?: Record<string, any>;
  retry_config?: { max_retries: number; retry_delay: number };
  timeout?: number;
  condition?: any;
  isCondition?: boolean;
  branchKey?: string;
  connectionStatus?: ConnectionChipStatus;
  connectionLabel?: string;
  executionStatus?: NodeExecutionStatus;
  isAgentAware?: boolean;
  channelBadge?: string | null;
  [key: string]: unknown;
}

export const PALETTE_DND_MIME = 'application/arrotech-tool';
