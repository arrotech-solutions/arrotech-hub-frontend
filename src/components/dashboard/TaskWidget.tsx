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
        }
        // Add other platforms here (Asana, etc.)
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
      case 'clickup': return <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">CU</span>;
      case 'asana': return <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">AS</span>;
      default: return <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">TASK</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    // ClickUp priorities: urgent (red), high (yellow), normal (cyan), low (grey)
    // Normalized to high/medium/low
    if (['urgent', 'high'].includes(priority)) return 'bg-red-50 text-red-600';
    if (['normal', 'medium'].includes(priority)) return 'bg-orange-50 text-orange-600';
    return 'bg-blue-50 text-blue-600';
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full transition-all duration-300 hover:shadow-md min-h-[300px]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/50 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Task Hub</h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {tasks.length} active
            </span>
          </div>
          <button
            onClick={addNewTask}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <p>No tasks found.</p>
              <p className="text-xs mt-1">Connect ClickUp or add a task.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="group p-3 rounded-xl border border-transparent hover:bg-emerald-50/50 hover:border-emerald-100 transition-all flex items-start space-x-3 cursor-pointer"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-1 w-5 h-5 rounded-md border-2 border-gray-300 hover:border-emerald-500 flex items-center justify-center transition-colors"
                >
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-0.5">
                    {getPlatformIcon(task.platform)}
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getPriorityColor(task.priority || '')}`}>
                      {task.priority || 'Normal'}
                    </span>
                    <span className="text-xs text-gray-400">{task.dueDate}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash className="w-3.5 h-3.5" />
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
