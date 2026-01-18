import React from 'react';
import { Plus, CheckCircle, Trash } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  platform: 'asana' | 'jira' | 'trello';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review PR #452 for authentication flow',
    platform: 'github' as any, // casting for mock simplicity if needed, or update interface
    dueDate: 'Today',
    priority: 'high',
    completed: false,
  },
  {
    id: '2',
    title: 'Update user documentation for API V2',
    platform: 'asana',
    dueDate: 'Tomorrow',
    priority: 'medium',
    completed: false,
  },
  {
    id: '3',
    title: 'Fix responsive layout bug on settings page',
    platform: 'jira',
    dueDate: 'In 2 days',
    priority: 'low',
    completed: false,
  },
];

const TaskWidget: React.FC = () => {
  // Assuming 'tasks' state and related functions are managed elsewhere or will be added.
  // For now, using mockTasks and placeholder functions to make the provided snippet syntactically correct.
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks);

  const addNewTask = () => {
    alert('Add New Task functionality not implemented yet.');
  };

  const toggleTask = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full transition-all duration-300 hover:shadow-md min-h-[300px]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/50 rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Tasks</h2>
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
            {tasks.filter(t => !t.completed).length} pending
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
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group p-3 rounded-xl border border-transparent hover:bg-emerald-50/50 hover:border-emerald-100 transition-all flex items-start space-x-3 cursor-pointer ${task.completed ? 'opacity-60' : ''
              }`}
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.completed
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-300 hover:border-emerald-500'
                }`}
            >
              {task.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </button>
            <div className="flex-1">
              <span className={`text-sm font-medium transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}>
                {task.title}
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                  task.priority === 'medium' ? 'bg-orange-50 text-orange-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                  {task.priority}
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
        ))}
      </div>
    </div>
  );
};


export default TaskWidget;
