import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Clock,
  Bell,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import apiService from '../services/api';
import { Workflow, AgentResponse } from '../types';

interface AgentCreatorModalProps {
  open: boolean;
  onClose: () => void;
  workflowId?: number;
  workflow?: Workflow;
  onAgentCreated?: (agent: AgentResponse) => void;
}

interface ScheduleConfig {
  type: 'interval' | 'cron' | 'manual';
  interval_seconds?: number;
  cron_expression?: string;
  max_executions?: number | null;
}

const AgentCreatorModal: React.FC<AgentCreatorModalProps> = ({
  open,
  onClose,
  workflowId,
  workflow,
  onAgentCreated,
}) => {
  // Form state
  const [scheduleType, setScheduleType] = useState<'interval' | 'cron' | 'manual'>('manual');
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [cronExpression, setCronExpression] = useState('0 9 * * 1-5');
  const [maxExecutions, setMaxExecutions] = useState<number | null>(null);
  
  // Notification settings
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(true);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [slackChannel, setSlackChannel] = useState('#automation-logs');
  const [notificationEmail, setNotificationEmail] = useState('');
  
  // Error handling
  const [retryOnFailure, setRetryOnFailure] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryDelay, setRetryDelay] = useState(30);
  const [pauseOnFailure, setPauseOnFailure] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<AgentResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'notifications' | 'errors'>('schedule');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      setCreatedAgent(null);
      setActiveTab('schedule');
    }
  }, [open]);

  const getIntervalSeconds = (): number => {
    const multipliers = {
      'minutes': 60,
      'hours': 3600,
      'days': 86400,
    };
    return intervalValue * multipliers[intervalUnit];
  };

  const buildScheduleConfig = (): ScheduleConfig => {
    const config: ScheduleConfig = {
      type: scheduleType,
      max_executions: maxExecutions,
    };

    if (scheduleType === 'interval') {
      config.interval_seconds = getIntervalSeconds();
    } else if (scheduleType === 'cron') {
      config.cron_expression = cronExpression;
    }

    return config;
  };

  const getCronDescription = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return 'Invalid cron expression';
    
    const presets: Record<string, string> = {
      '0 * * * *': 'Every hour',
      '0 0 * * *': 'Every day at midnight',
      '0 9 * * 1-5': 'Weekdays at 9 AM',
      '0 9 * * *': 'Every day at 9 AM',
      '0 0 * * 0': 'Every Sunday at midnight',
      '0 0 1 * *': 'First day of every month',
    };
    
    return presets[cron] || 'Custom schedule';
  };

  const handleCreateAgent = async () => {
    if (!workflowId) {
      setError('No workflow selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createAgent({
        workflow_id: workflowId,
        agent_config: {
          schedule: buildScheduleConfig(),
          notifications: {
            notify_on_success: notifyOnSuccess,
            notify_on_failure: notifyOnFailure,
            slack_channel: slackChannel || undefined,
            email: notificationEmail || undefined,
          },
          error_handling: {
            retry_on_failure: retryOnFailure,
            max_retries: maxRetries,
            retry_delay_seconds: retryDelay,
            pause_on_failure: pauseOnFailure,
          },
        },
      });

      if (response.success && response.data) {
        // Schedule the agent if not manual
        if (scheduleType !== 'manual' && response.data.agent_id) {
          await apiService.scheduleAgent(response.data.agent_id, buildScheduleConfig());
        }

        setSuccess(true);
        setCreatedAgent(response.data);
        onAgentCreated?.(response.data);
      } else {
        setError(response.error || 'Failed to create agent');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the agent');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Autonomous Agent</h2>
              <p className="text-sm text-white/80">
                Workflow ID: {workflowId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {success ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Agent Created Successfully!
              </h3>
              <p className="text-gray-600 mb-2">
                Agent ID: <span className="font-mono text-purple-600">{createdAgent?.agent_id}</span>
              </p>
              <p className="text-gray-600 mb-6">
                {scheduleType === 'manual' 
                  ? 'Your agent is ready to run manually.'
                  : 'Your agent will run according to the configured schedule.'}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Navigate to agents page or trigger execution
                    onClose();
                  }}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>View Agents</span>
                </button>
              </div>
            </div>
          ) : (
            // Form
            <div className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { id: 'schedule', label: 'Schedule', icon: Clock },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'errors', label: 'Error Handling', icon: AlertCircle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Type
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'manual', label: 'Manual', desc: 'Run on demand', icon: Play },
                        { value: 'interval', label: 'Interval', desc: 'Run every X time', icon: RefreshCw },
                        { value: 'cron', label: 'Cron', desc: 'Advanced scheduling', icon: Clock },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            scheduleType === option.value
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="scheduleType"
                            value={option.value}
                            checked={scheduleType === option.value}
                            onChange={(e) => setScheduleType(e.target.value as typeof scheduleType)}
                            className="w-4 h-4 text-green-600"
                          />
                          <div className={`p-2 rounded-lg ${
                            scheduleType === option.value ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <option.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{option.label}</p>
                            <p className="text-xs text-gray-500">{option.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {scheduleType === 'interval' && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Run every
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={intervalValue}
                          onChange={(e) => setIntervalValue(Number(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <select
                          value={intervalUnit}
                          onChange={(e) => setIntervalUnit(e.target.value as typeof intervalUnit)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {scheduleType === 'cron' && (
                    <div className="space-y-4">
                      {/* User-friendly presets */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📅 Quick Schedule (Recommended)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '⏰ Every hour', value: '0 * * * *', desc: 'On the hour' },
                            { label: '🌅 Every morning (9 AM)', value: '0 9 * * *', desc: 'Daily at 9 AM' },
                            { label: '💼 Weekdays (9 AM)', value: '0 9 * * 1-5', desc: 'Mon-Fri at 9 AM' },
                            { label: '📆 Weekly (Sunday)', value: '0 0 * * 0', desc: 'Every Sunday midnight' },
                            { label: '🌙 Every night (11 PM)', value: '0 23 * * *', desc: 'Daily at 11 PM' },
                            { label: '📊 Monthly (1st day)', value: '0 9 1 * *', desc: '1st of each month' },
                          ].map((preset) => (
                            <button
                              key={preset.value}
                              onClick={() => setCronExpression(preset.value)}
                              className={`p-3 text-left rounded-lg border transition-all ${
                                cronExpression === preset.value
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <p className="font-medium text-gray-900 text-sm">{preset.label}</p>
                              <p className="text-xs text-gray-500">{preset.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Human-readable description */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Currently set to run:</span>{' '}
                          {getCronDescription(cronExpression)}
                        </p>
                      </div>
                      
                      {/* Advanced: Raw cron expression */}
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          🔧 Advanced: Edit cron expression directly (for developers)
                        </summary>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={cronExpression}
                            onChange={(e) => setCronExpression(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                            placeholder="0 9 * * 1-5"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: minute hour day-of-month month day-of-week
                          </p>
                        </div>
                      </details>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Executions (optional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={maxExecutions || ''}
                      onChange={(e) => setMaxExecutions(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Unlimited"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for unlimited executions
                    </p>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">Notify on success</span>
                      </div>
                      <button
                        onClick={() => setNotifyOnSuccess(!notifyOnSuccess)}
                        className={`w-11 h-6 rounded-full transition-colors ${
                          notifyOnSuccess ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          notifyOnSuccess ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-medium text-gray-900">Notify on failure</span>
                      </div>
                      <button
                        onClick={() => setNotifyOnFailure(!notifyOnFailure)}
                        className={`w-11 h-6 rounded-full transition-colors ${
                          notifyOnFailure ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          notifyOnFailure ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slack Channel
                    </label>
                    <input
                      type="text"
                      value={slackChannel}
                      onChange={(e) => setSlackChannel(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="#automation-logs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>
              )}

              {/* Error Handling Tab */}
              {activeTab === 'errors' && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <RefreshCw className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Retry on failure</span>
                        <p className="text-xs text-gray-500">Automatically retry failed executions</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRetryOnFailure(!retryOnFailure)}
                      className={`w-11 h-6 rounded-full transition-colors ${
                        retryOnFailure ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        retryOnFailure ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>

                  {retryOnFailure && (
                    <div className="pl-4 border-l-2 border-orange-200 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Max Retries
                          </label>
                          <span className="text-sm font-mono text-gray-600">{maxRetries}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={maxRetries}
                          onChange={(e) => setMaxRetries(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Retry Delay
                          </label>
                          <span className="text-sm font-mono text-gray-600">{retryDelay}s</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={300}
                          step={5}
                          value={retryDelay}
                          onChange={(e) => setRetryDelay(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Pause className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Pause on failure</span>
                        <p className="text-xs text-gray-500">Pause agent after all retries fail</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPauseOnFailure(!pauseOnFailure)}
                      className={`w-11 h-6 rounded-full transition-colors ${
                        pauseOnFailure ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        pauseOnFailure ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleCreateAgent}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Create Agent</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCreatorModal;
