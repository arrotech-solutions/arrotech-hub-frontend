import { useCallback, useState } from 'react';
import { Edge, Node } from '@xyflow/react';
import toast from '../../../lib/notify';
import apiService from '../../../services/api';
import { nodesToSteps } from './graphConvert';
import { CanvasState } from './types';

type SaveArgs = {
  nodes: Node[];
  edges: Edge[];
  workflowName: string;
  workflowDescription: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  category: string;
  tags: string;
  variables: Record<string, any>;
  isEditing: boolean;
  initialData?: any;
  onWorkflowCreated?: (workflow: any) => void;
  onClose: () => void;
  validationErrors: string[];
};

export function useCanvasSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCanvasState = useCallback(
    (args: Omit<SaveArgs, 'isEditing' | 'initialData' | 'onWorkflowCreated' | 'onClose' | 'validationErrors'> & { workflowId?: string }): CanvasState => {
      const steps = nodesToSteps(args.nodes, args.edges);
      return {
        workflowName: args.workflowName,
        description: args.workflowDescription,
        triggerType: args.triggerType,
        triggerConfig: args.triggerConfig,
        category: args.category,
        tags: args.tags,
        steps,
        variables: args.variables,
        workflowId: args.workflowId,
      };
    },
    []
  );

  const handleSave = useCallback(async (args: SaveArgs) => {
    const {
      nodes,
      edges,
      workflowName,
      workflowDescription,
      triggerType,
      triggerConfig,
      category,
      tags,
      variables,
      isEditing,
      initialData,
      onWorkflowCreated,
      onClose,
      validationErrors,
    } = args;

    if (!workflowName.trim()) {
      setError('Please enter a workflow name');
      return { ok: false, needMeta: true as const };
    }

    const steps = nodesToSteps(nodes, edges);
    if (steps.length === 0) {
      setError('Please add at least one step');
      return { ok: false };
    }

    if (validationErrors.length > 0) {
      setError(`Fix ${validationErrors.length} issue(s) before saving`);
      return { ok: false, needValidation: true as const };
    }

    setSaving(true);
    setError(null);

    try {
      const stepsPayload = steps.map((step, index) => ({
        step_number: index + 1,
        tool_name: step.tool_name,
        tool_parameters: step.tool_parameters,
        description: step.description,
        condition: step.condition,
        retry_config: step.retry_config,
        timeout: step.timeout,
      }));

      const metadata = {
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        canvas_layout: true,
        // Key by step_number so reload survives server UUID reassignment
        branch_keys: Object.fromEntries(
          steps.filter((s) => s.branch_key).map((s) => [String(s.step_number), s.branch_key])
        ),
      };

      if (isEditing && initialData?.id) {
        const response = await apiService.updateWorkflow(initialData.id, {
          name: workflowName,
          description: workflowDescription || `Updated with ${steps.length} steps`,
          steps: stepsPayload,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          variables: variables || {},
          workflow_metadata: {
            ...(initialData.workflow_metadata || {}),
            ...metadata,
          },
        });
        if (response.success && response.data) {
          toast.success(`Automation "${workflowName}" updated`);
          onWorkflowCreated?.(response.data);
          onClose();
          return { ok: true };
        }
        setError('Failed to update workflow');
        return { ok: false };
      }

      const response = await apiService.createWorkflowFromSteps({
        workflow_name: workflowName,
        description: workflowDescription || `Created with ${steps.length} steps`,
        steps: stepsPayload,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        variables: variables || {},
        workflow_metadata: metadata,
      });

      if (response.success && response.data) {
        const createdId = response.data.id;
        // Ensure metadata/branch_keys persist even if create ignores workflow_metadata
        if (createdId) {
          try {
            await apiService.updateWorkflow(createdId, {
              workflow_metadata: {
                ...(response.data.workflow_metadata || {}),
                ...metadata,
              },
              variables: variables || {},
            });
          } catch {
            /* non-blocking — workflow itself was created */
          }
        }
        toast.success(`Automation "${workflowName}" created`);
        onWorkflowCreated?.(response.data);
        onClose();
        return { ok: true };
      }
      setError('Failed to create workflow');
      return { ok: false };
    } catch (err: any) {
      setError(err.message || 'Failed to save workflow');
      return { ok: false };
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, error, setError, handleSave, getCanvasState };
}
