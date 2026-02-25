import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, Trash, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import CreateTaskModal from './CreateTaskModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  platform: 'clickup' | 'asana' | 'trello' | 'jira' | 'other';
  status: string;
  priority?: string;
  dueDate?: string;
  url?: string;
  originalData?: any;
}

interface TaskWidgetProps {
  openModalTrigger?: number;
}

const TaskWidget: React.FC<TaskWidgetProps> = ({ openModalTrigger }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    if (openModalTrigger && openModalTrigger > 0) {
      setIsModalOpen(true);
    }
  }, [openModalTrigger]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // 1. Get active connections to see which platforms are connected
      const connectionsRes = await apiService.getConnections();
      const connectedPlatforms = connectionsRes.data || [];
      setConnections(connectedPlatforms);
      console.log('DEBUG: Connected Platforms:', connectedPlatforms);

      // 2. Filter for supported task platforms (currently ClickUp)
      const taskPlatforms = connectedPlatforms.filter(c =>
        ['clickup', 'asana', 'trello', 'jira'].includes(c.platform.toLowerCase()) &&
        c.status === 'active'
      );
      console.log('DEBUG: Task Platforms:', taskPlatforms);

      const allTasks: Task[] = [];

      // 3. Fetch tasks from each platform
      for (const conn of taskPlatforms) {
        if (conn.platform.toLowerCase() === 'clickup') {
          try {
            console.log('DEBUG: Fetching ClickUp tasks for team:', conn.config.teams?.[0]?.id);
            const result = await apiService.executeMCPTool('clickup_task_management', {
              operation: 'get_team_tasks',
              team_id: conn.config.teams?.[0]?.id // Use first available team
            });
            console.log('DEBUG: ClickUp Result:', result);

            if (result.success && result.result && result.result.tasks) {
              const clickupTasks = result.result.tasks.map((t: any) => ({
                id: t.id,
                title: t.name,
                description: t.description,
                platform: 'clickup',
                status: t.status?.status || 'unknown',
                priority: t.priority?.priority || 'none',
                dueDate: t.due_date ? new Date(parseInt(t.due_date)).toLocaleDateString() : 'No due date',
                url: t.url,
                originalData: t
              }));
              allTasks.push(...clickupTasks);
            }
          } catch (err) {
            console.error('Failed to fetch ClickUp tasks', err);
            // Don't fail entire widget if one integration fails
          }
        } else if (conn.platform.toLowerCase() === 'asana') {
          try {
            console.log('DEBUG: Fetching Asana tasks...');
            const result = await apiService.executeMCPTool('asana_list_tasks', {
              limit: 10,
              opt_fields: ['gid', 'name', 'completed', 'due_on', 'projects.name', 'memberships.section.name']
            });
            console.log('DEBUG: Asana Result:', result);

            // Handle nested data structure: result.data.data -> array
            let rawTasks = [];
            if (result.data && Array.isArray(result.data)) {
              rawTasks = result.data;
            } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
              rawTasks = result.data.data;
            } else if (result.data && result.data.data && typeof result.data.data === 'object' && result.data.data.data && Array.isArray(result.data.data.data)) {
              // Ultra-defensive: AsanaService wrapper -> ToolExecutor wrapper -> potentially extra nesting
              rawTasks = result.data.data.data;
            }

            if (rawTasks.length > 0) {
              const asanaTasks = rawTasks.map((t: any) => {
                let mapStatus = 'todo';
                if (t.completed) {
                  mapStatus = 'done';
                } else {
                  // Check ALL memberships
                  if (t.memberships && Array.isArray(t.memberships)) {
                    for (const m of t.memberships) {
                      const sectionName = m.section?.name?.toLowerCase() || '';
                      if (!sectionName) continue;

                      if (sectionName.includes('done') || sectionName.includes('complete')) {
                        mapStatus = 'done';
                        break;
                      } else if (sectionName.includes('progress') || sectionName.includes('doing') || sectionName.includes('active')) {
                        mapStatus = 'in_progress';
                        break;
                      } else if (sectionName.includes('review') || sectionName.includes('qa')) {
                        mapStatus = 'review';
                        break;
                      }
                    }
                  }
                }

                return {
                  id: t.gid,
                  title: t.name,
                  description: t.notes || '',
                  platform: 'asana',
                  status: mapStatus,
                  priority: 'medium',
                  dueDate: t.due_on ? new Date(t.due_on).toLocaleDateString() : 'No due date',
                  url: t.permalink_url,
                  originalData: t
                };
              });
              allTasks.push(...asanaTasks);
            }
          } catch (err) {
            console.error('Failed to fetch Asana tasks', err);
          }
        }
      }

      setTasks(allTasks);

    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addNewTask = () => {
    setIsModalOpen(true);
  };

  const toggleTask = (id: string) => {
    // Implement tool call to update status
    toast.success('Task status updated (simulation)');
  };

  const deleteTask = (id: string) => {
    // Implement tool call to delete
    toast.success('Task deleted (simulation)');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'clickup': return <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">CU</span>;
      case 'asana': return <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">AS</span>;
      default: return <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">TASK</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    // ClickUp priorities: urgent (red), high (yellow), normal (cyan), low (grey)
    // Normalized to high/medium/low
    if (['urgent', 'high'].includes(priority)) return 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400';
    if (['normal', 'medium'].includes(priority)) return 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400';
    return 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
  }

  return (
    <>
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-full transition-all duration-300 hover:shadow-md min-h-[300px]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Task Hub</h2>
            <span className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              {tasks.length} active
            </span>
          </div>
          <button
            onClick={addNewTask}
            className="p-2 text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-600 space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <CheckCircle className="w-8 h-8 opacity-40" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest">Workspace Clear</p>
                <p className="text-[9px] font-medium mt-1">Connect ClickUp or add a task to begin.</p>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="group p-4 rounded-2xl border border-transparent hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 hover:border-emerald-100 dark:hover:border-emerald-500/20 transition-all flex items-start space-x-4 cursor-pointer"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-1 w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 flex items-center justify-center transition-all bg-white dark:bg-slate-800 shadow-sm"
                >
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-0.5">
                    {getPlatformIcon(task.platform)}
                    <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 tracking-tight">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getPriorityColor(task.priority || '')}`}>
                      {task.priority || 'Normal'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tighter">{task.dueDate}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        connections={connections}
        onTaskCreated={() => {
          fetchTasks(); // Refresh list on success
        }}
      />
    </>
  );
};

export default TaskWidget;
