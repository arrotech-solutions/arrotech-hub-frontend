import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import apiService from '../../services/api';
import { ClickUpLogo, TrelloLogo, JiraLogo, AsanaLogo } from '../BrandIcons';

interface Task {
    id: string;
    description: string;
    project: string; // e.g., "Website Redesign"
    platform: 'clickup' | 'jira' | 'trello' | 'asana';
    status: 'todo' | 'in_progress' | 'review' | 'done';
    dueDate: string;
    assignee?: string;
}

interface TaskHubTileProps {
    onCreateTask: () => void;
}

const TaskHubTile: React.FC<TaskHubTileProps> = ({ onCreateTask }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'my_tasks'>('my_tasks');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            // 1. Check connections first to avoid unnecessary failures
            const connectionsRes = await apiService.getConnections();
            console.log("Active Connections:", connectionsRes);
            const activePlatforms = connectionsRes.data?.map((c: any) => c.platform) || [];

            const promises = [];

            // ClickUp: Complex fetch (Get Teams -> Get Tasks)
            if (activePlatforms.includes('clickup')) {
                const clickupPromise = (async () => {
                    // First get teams to find a valid team_id
                    try {
                        const teamsRes = await apiService.executeMCPTool('clickup_task_management', { operation: 'get_teams' });
                        console.log("ClickUp Teams:", teamsRes);
                        const teams = teamsRes.data?.teams || teamsRes.result?.teams || [];
                        if (teams.length > 0) {
                            const teamId = teams[0].id;
                            console.log("Fetching ClickUp tasks for team:", teamId);
                            // Try getting tasks for this team
                            return await apiService.executeMCPTool('clickup_task_management', { operation: 'get_team_tasks', team_id: teamId });
                        }
                    } catch (e) {
                        console.error("ClickUp Fetch Error:", e);
                    }
                    return null;
                })();
                promises.push(clickupPromise);
            } else {
                promises.push(Promise.resolve(null));
            }

            // Trello
            if (activePlatforms.includes('trello')) {
                console.log("Fetching Trello cards...");
                promises.push(apiService.executeMCPTool('trello_project_management', { action: 'search_cards', query: 'member:me -is:archived' }));
            } else {
                promises.push(Promise.resolve(null));
            }

            // Jira
            if (activePlatforms.includes('jira')) {
                console.log("Fetching Jira issues...");
                promises.push(apiService.executeMCPTool('jira_issue_tracking', { action: 'search_issues', jql: 'assignee = currentUser() AND resolution = Unresolved order by updated DESC' }));
            } else {
                promises.push(Promise.resolve(null));
            }

            // Asana (Future proofing)
            if (activePlatforms.includes('asana')) {
                promises.push(apiService.executeMCPTool('asana_task_management', { operation: 'list', limit: 10 }));
            } else {
                promises.push(Promise.resolve(null));
            }


            const results = await Promise.allSettled(promises);
            console.log("Fetch Results:", results);
            const [clickupRes, trelloRes, jiraRes, asanaRes] = results;

            let allTasks: Task[] = [];

            // Helper to check success
            const isSuccess = (res: any) => res.status === 'fulfilled' && res.value && (res.value.success || res.value.data || res.value.result);
            const getData = (res: any) => res.status === 'fulfilled' ? (res.value?.data || res.value?.result || res.value) : null;

            // ClickUp Processing
            if (isSuccess(clickupRes)) {
                const data = getData(clickupRes);
                console.log("ClickUp Data:", data);
                const rawTasks = data?.tasks || [];
                if (Array.isArray(rawTasks)) {
                    allTasks.push(...rawTasks.map((t: any): Task => ({
                        id: t.id,
                        description: t.name,
                        project: t.list?.name || t.project?.name || 'ClickUp',
                        platform: 'clickup',
                        status: (t.status?.status === 'complete' || t.status?.status === 'closed' ? 'done' : 'in_progress') as Task['status'],
                        dueDate: t.due_date ? new Date(parseInt(t.due_date)).toLocaleDateString() : 'No Date'
                    })));
                }
            }

            // Trello Processing
            if (isSuccess(trelloRes)) {
                const data = getData(trelloRes);
                console.log("Trello Data:", data);
                const rawCards = data?.cards || [];
                if (Array.isArray(rawCards)) {
                    allTasks.push(...rawCards.map((c: any): Task => ({
                        id: c.id,
                        description: c.name,
                        project: c.board?.name || 'Trello Board',
                        platform: 'trello',
                        status: 'todo' as Task['status'], // Default to todo
                        dueDate: c.due ? new Date(c.due).toLocaleDateString() : 'No Date'
                    })));
                }
            }

            // Jira Processing
            if (isSuccess(jiraRes)) {
                const data = getData(jiraRes);
                console.log("Jira Data:", data);
                const rawIssues = data?.issues || [];
                if (Array.isArray(rawIssues)) {
                    allTasks.push(...rawIssues.map((i: any): Task => ({
                        id: i.key,
                        description: i.fields?.summary || 'Jira Issue',
                        project: i.fields?.project?.name || 'Jira Project',
                        platform: 'jira',
                        status: (i.fields?.status?.name.toLowerCase() === 'done' ? 'done' : 'in_progress') as Task['status'],
                        dueDate: i.fields?.duedate ? new Date(i.fields.duedate).toLocaleDateString() : 'No Date'
                    })));
                }
            }

            // Asana Processing
            if (isSuccess(asanaRes)) {
                const data = getData(asanaRes);
                const rawTasks = data?.data || [];
                if (Array.isArray(rawTasks)) {
                    allTasks.push(...rawTasks.map((t: any): Task => ({
                        id: t.gid,
                        description: t.name,
                        project: t.projects?.[0]?.name || 'Asana Project',
                        platform: 'asana',
                        status: (t.completed ? 'done' : 'todo') as Task['status'],
                        dueDate: t.due_on ? new Date(t.due_on).toLocaleDateString() : 'No Date'
                    })));
                }
            }


            console.log("Final Aggregated Tasks:", allTasks);

            // Only use fallback if we strictly have NO tasks and (optionally) NO connections
            // But user requested "show actual data", so we should prefer empty state if connected but no tasks
            if (allTasks.length === 0 && activePlatforms.length === 0) {
                // Keep mock data ONLY if no platforms are connected, to show potential
                allTasks = [
                    { id: '1', description: 'Connect your tools!', project: 'Setup', platform: 'clickup', status: 'in_progress', dueDate: 'Today' },
                ];
            } else if (allTasks.length === 0) {
                // If connected but no tasks, let it be empty (the UI handles empty state)
            }

            setTasks(allTasks);

        } catch (err) {
            console.error("Failed to fetch tasks", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // ... (Chart data logic remains similar)
    const statusData = [
        { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#6366f1' }, // Indigo
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#a855f7' }, // Purple
        { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#ec4899' }, // Pink
        { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' }, // Emerald
    ];

    const getIcon = (platform: string) => {
        switch (platform) {
            case 'clickup': return <ClickUpLogo className="w-3.5 h-3.5" />;
            case 'jira': return <JiraLogo className="w-3.5 h-3.5" />;
            case 'trello': return <TrelloLogo className="w-3.5 h-3.5" />;
            case 'asana': return <AsanaLogo className="w-3.5 h-3.5" />;
            default: return <CheckSquare className="w-3.5 h-3.5 text-gray-500" />;
        }
    };



    return (
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl flex flex-col h-full overflow-hidden group transition-all hover:shadow-2xl relative">
            {/* Premium Header (2-Row Layout) */}
            <div className="px-6 py-4 border-b border-white/30 flex flex-col gap-3 bg-gradient-to-r from-white/40 to-transparent">
                {/* Row 1: Title & Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Task Hub</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={onCreateTask} className="group/btn relative overflow-hidden p-2 bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 px-3">
                            <Plus className="w-4 h-4 relative z-10" />
                            <span className="text-xs font-bold relative z-10">New Task</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </button>
                        <button onClick={fetchTasks} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-all">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Row 2: Stats & Tabs */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {tasks.filter(t => t.status !== 'done').length} Active Tasks
                    </div>

                    <div className="flex items-center bg-white/40 p-1 rounded-xl border border-white/50 backdrop-blur-sm shadow-sm">
                        <button
                            onClick={() => setFilter('my_tasks')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${filter === 'my_tasks' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            My Tasks
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 flex overflow-hidden">
                {/* Premium Card List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-0">
                    {tasks.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <CheckSquare className="w-10 h-10 mb-3 text-gray-300" />
                            <span className="text-sm font-medium">All caught up!</span>
                        </div>
                    )}

                    {tasks.map((task) => (
                        <div key={task.id} className="group/item relative flex items-center gap-4 p-3.5 bg-white/60 hover:bg-white/90 rounded-2xl border border-white/60 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer">

                            {/* Priority/Status Indicator strip */}
                            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all ${task.status === 'in_progress' ? 'bg-indigo-500' :
                                task.status === 'review' ? 'bg-purple-500' :
                                    task.status === 'done' ? 'bg-emerald-400' : 'bg-gray-300'
                                }`} />

                            {/* Leading Icon */}
                            <div className="pl-2">
                                <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                    {getIcon(task.platform)}
                                </div>
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className={`text-sm font-bold truncate pr-2 transition-colors ${task.status === 'done' ? 'text-gray-400 line-through decoration-indigo-300' : 'text-gray-800 group-hover/item:text-indigo-900'}`}>{task.description}</p>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 shrink-0 uppercase tracking-wider">{task.platform}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        {task.project}
                                    </span>
                                    {task.dueDate !== 'No Date' && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${task.dueDate === 'Today' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                            {task.dueDate}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status Dot (Minimalist) */}
                            <div className="pr-1 flex flex-col items-end gap-1">
                                <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${task.status === 'in_progress' ? 'bg-indigo-500' :
                                    task.status === 'review' ? 'bg-purple-500' :
                                        task.status === 'done' ? 'bg-emerald-500' : 'bg-gray-300'
                                    }`} title={task.status.replace('_', ' ')} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Premium Chart Sidebar (XL screens) */}
                <div className="w-[200px] hidden xl:flex flex-col p-0 bg-white/20 border-l border-white/40 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    <div className="h-40 w-full relative mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={6}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={4}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.95)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#374151' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-gray-800 tracking-tighter">{tasks.length}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-[-2px]">Total</span>
                        </div>
                    </div>

                    <div className="flex-1 px-4 py-2 space-y-3">
                        {statusData.filter(d => d.value > 0).map((item) => (
                            <div key={item.name} className="flex items-center justify-between group cursor-default">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: item.color }} />
                                    <span className="text-[11px] text-gray-500 font-bold group-hover:text-gray-700 transition-colors">{item.name}</span>
                                </div>
                                <span className="text-[11px] font-bold text-gray-800 bg-white/50 px-1.5 rounded-md min-w-[20px] text-center">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <button className="mx-4 mb-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100 transition-colors">
                        View Analytics
                    </button>
                </div>
            </div>
            <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(100,100,100,0.1);
                border-radius: 4px;
            }
            `}</style>
        </div>
    );
};

export default TaskHubTile;
