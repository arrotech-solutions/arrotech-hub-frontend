import React, { useState, useEffect } from 'react';
import {
    CheckSquare, Plus, Search, MoreHorizontal, Calendar,
    RefreshCw, Loader2, Clock, AlertCircle, LayoutGrid, List as ListIcon,
    X
} from 'lucide-react';
import apiService from '../services/api';
import { ClickUpLogo, TrelloLogo, JiraLogo, AsanaLogo } from '../components/BrandIcons';
import { PieChart, Pie, Cell } from 'recharts';

interface Task {
    id: string;
    description: string;
    project: string;
    platform: 'clickup' | 'jira' | 'trello' | 'asana';
    status: 'todo' | 'in_progress' | 'review' | 'done';
    dueDate: string;
    assignee?: string;
    priority?: 'high' | 'medium' | 'low';
    boardId?: string; // For Trello
}

const UnifiedTaskView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [activePlatformFilter, setActivePlatformFilter] = useState<string | null>(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            // 1. Check connections first
            const connectionsRes = await apiService.getConnections();
            const activePlatforms = connectionsRes.data?.map((c: any) => c.platform) || [];

            const promises = [];

            // ClickUp
            if (activePlatforms.includes('clickup')) {
                const clickupPromise = (async () => {
                    try {
                        const teamsRes = await apiService.executeMCPTool('clickup_task_management', { operation: 'get_teams' });
                        const teams = teamsRes.data?.teams || teamsRes.result?.teams || [];
                        if (teams.length > 0) {
                            const teamId = teams[0].id;
                            return await apiService.executeMCPTool('clickup_task_management', { operation: 'get_team_tasks', team_id: teamId, include_closed: true });
                        }
                    } catch (e) { console.error("ClickUp Fetch Error:", e); }
                    return null;
                })();
                promises.push(clickupPromise);
            } else { promises.push(Promise.resolve(null)); }

            // Trello
            if (activePlatforms.includes('trello')) {
                promises.push(apiService.executeMCPTool('trello_project_management', { action: 'search_cards', query: 'is:open' }));
            } else { promises.push(Promise.resolve(null)); }

            // Jira
            if (activePlatforms.includes('jira')) {
                // Fetch all recent issues including done ones
                promises.push(apiService.executeMCPTool('jira_issue_tracking', { action: 'search_issues', jql: 'updated >= -30d order by updated DESC' }));
            } else { promises.push(Promise.resolve(null)); }

            // Asana
            if (activePlatforms.includes('asana')) {
                promises.push(apiService.executeMCPTool('asana_task_management', { operation: 'list', limit: 20 }));
            } else { promises.push(Promise.resolve(null)); }

            const results = await Promise.allSettled(promises);
            const [clickupRes, trelloRes, jiraRes, asanaRes] = results;

            let allTasks: Task[] = [];
            const isSuccess = (res: any) => res.status === 'fulfilled' && res.value && (res.value.success || res.value.data || res.value.result);
            const getData = (res: any) => res.status === 'fulfilled' ? (res.value?.data || res.value?.result || res.value) : null;

            // Process results (ClickUp, Trello, Jira, Asana)
            if (isSuccess(clickupRes)) {
                const raw = getData(clickupRes)?.tasks || [];
                if (Array.isArray(raw)) {
                    allTasks.push(...raw.map((t: any): Task => {
                        const statusRaw = t.status?.status || '';
                        const statusLower = statusRaw.toLowerCase();
                        console.log(`ClickUp task ${t.id} status: "${statusRaw}"`);

                        let mapStatus: 'todo' | 'in_progress' | 'review' | 'done' = 'todo';

                        if (statusLower.includes('complete') || statusLower.includes('closed') || statusLower.includes('done')) {
                            mapStatus = 'done';
                        } else if (statusLower.includes('progress') || statusLower.includes('doing') || statusLower.includes('active') || statusLower.includes('running')) {
                            mapStatus = 'in_progress';
                        } else if (statusLower.includes('review') || statusLower.includes('qa')) {
                            mapStatus = 'review';
                        } else if (statusLower.includes('to do') || statusLower.includes('todo') || statusLower.includes('open') || statusLower.includes('new')) {
                            mapStatus = 'todo';
                        }

                        return {
                            id: t.id,
                            description: t.name,
                            project: t.list?.name || 'ClickUp',
                            platform: 'clickup',
                            status: mapStatus,
                            dueDate: t.due_date ? new Date(parseInt(t.due_date)).toLocaleDateString() : 'No Date',
                            priority: t.priority?.priority === 'high' ? 'high' : 'medium'
                        };
                    }));
                }
            }
            if (isSuccess(trelloRes)) {
                const trelloData = getData(trelloRes);
                const raw = trelloData?.cards || trelloData?.data?.cards || [];
                if (Array.isArray(raw)) {
                    allTasks.push(...raw.map((c: any): Task => {
                        // Map Trello list name to status
                        const listName = (c.list?.name || c.listName || '').toLowerCase();
                        let mapStatus: 'todo' | 'in_progress' | 'review' | 'done' = 'todo';

                        if (listName.includes('done') || listName.includes('complete') || listName.includes('closed')) {
                            mapStatus = 'done';
                        } else if (listName.includes('progress') || listName.includes('doing') || listName.includes('working')) {
                            mapStatus = 'in_progress';
                        } else if (listName.includes('review') || listName.includes('testing') || listName.includes('qa')) {
                            mapStatus = 'review';
                        } else if (listName.includes('to do') || listName.includes('todo') || listName.includes('backlog') || listName.includes('open')) {
                            mapStatus = 'todo';
                        }

                        return {
                            id: c.id,
                            description: c.name,
                            project: c.board?.name || 'Trello',
                            platform: 'trello',
                            status: mapStatus,
                            dueDate: c.due ? new Date(c.due).toLocaleDateString() : 'No Date',
                            priority: 'medium',
                            boardId: c.board_id
                        };
                    }));
                }
            }
            if (isSuccess(jiraRes)) {
                console.log('Jira Res:', jiraRes);
                const jiraData = getData(jiraRes);
                const raw = jiraData?.issues || jiraData?.data?.issues || [];
                console.log('Jira Raw:', raw);
                if (Array.isArray(raw)) {
                    allTasks.push(...raw.map((i: any): Task => {
                        const statusRaw = i.status || '';
                        const statusLower = statusRaw.toLowerCase();
                        console.log(`Jira issue ${i.key} status: "${statusRaw}"`);

                        let mapStatus: 'todo' | 'in_progress' | 'review' | 'done' = 'todo';

                        // Map Jira status to unified columns
                        if (statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('closed') || statusLower.includes('resolved')) {
                            mapStatus = 'done';
                        } else if (statusLower.includes('progress') || statusLower.includes('doing') || statusLower.includes('working') || statusLower.includes('active')) {
                            mapStatus = 'in_progress';
                        } else if (statusLower.includes('review') || statusLower.includes('testing') || statusLower.includes('qa') || statusLower.includes('verification')) {
                            mapStatus = 'review';
                        } else if (statusLower.includes('to do') || statusLower.includes('todo') || statusLower.includes('open') || statusLower.includes('new') || statusLower.includes('backlog')) {
                            mapStatus = 'todo';
                        }

                        return {
                            id: i.key,
                            description: i.summary || 'Issue',
                            project: i.project || 'Jira',
                            platform: 'jira',
                            status: mapStatus,
                            dueDate: i.created ? new Date(i.created).toLocaleDateString() : 'No Date',
                            priority: i.priority === 'High' ? 'high' : 'medium'
                        };
                    }));
                }
            }
            if (isSuccess(asanaRes)) {
                const raw = getData(asanaRes)?.data || [];
                if (Array.isArray(raw)) {
                    allTasks.push(...raw.map((t: any): Task => ({
                        id: t.gid, description: t.name, project: t.projects?.[0]?.name || 'Asana', platform: 'asana',
                        status: (t.completed ? 'done' : 'todo'),
                        dueDate: t.due_on ? new Date(t.due_on).toLocaleDateString() : 'No Date',
                        priority: 'medium'
                    })));
                }
            }

            // Process results
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

    const filteredTasks = tasks.filter(task => {
        const matchPlatform = !activePlatformFilter || task.platform === activePlatformFilter;
        const matchSearch = task.description.toLowerCase().includes(filterText.toLowerCase()) ||
            task.project.toLowerCase().includes(filterText.toLowerCase());
        return matchPlatform && matchSearch;
    });

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'clickup': return <ClickUpLogo className="w-4 h-4" />;
            case 'jira': return <JiraLogo className="w-4 h-4" />;
            case 'trello': return <TrelloLogo className="w-4 h-4" />;
            case 'asana': return <AsanaLogo className="w-4 h-4" />;
            default: return <CheckSquare className="w-4 h-4 text-gray-500" />;
        }
    }

    const PriorityBadge = ({ priority }: { priority?: string }) => {
        const colors = {
            high: 'bg-red-100 text-red-700 border-red-200',
            medium: 'bg-orange-100 text-orange-700 border-orange-200',
            low: 'bg-green-100 text-green-700 border-green-200'
        };
        const colorClass = (colors as any)[priority || 'medium'];
        return (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${colorClass}`}>
                {priority || 'normal'}
            </span>
        );
    };

    const columns = [
        { id: 'todo', label: 'To Do', color: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400' },
        { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500' },
        { id: 'review', label: 'In Review', color: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500' },
        { id: 'done', label: 'Done', color: 'bg-green-50 border-green-100', dot: 'bg-green-500' }
    ];

    // Stats for Bento Grid
    const stats = [
        { label: 'Total Tasks', value: tasks.length, icon: CheckSquare, color: 'bg-indigo-500 text-white' },
        { label: 'High Priority', value: tasks.filter(t => t.priority === 'high').length, icon: AlertCircle, color: 'bg-red-500 text-white' },
        { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'bg-blue-500 text-white' },
    ];

    const chartData = [
        { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#9ca3af' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
        { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#a855f7' },
        { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#22c55e' },
    ];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTask, setNewTask] = useState({
        platform: 'jira',
        title: '',
        description: '',
        targetId: '', // Board/Project/Team ID
        subTargetId: '', // List ID (for Trello)
        dueDate: '',
        // Jira specific
        jiraIssueType: 'Task',
        jiraStatus: 'To Do',
        // ClickUp specific
        clickupSpaceId: '',
        clickupFolderId: '',
        clickupListId: ''
    });

    const [availableTargets, setAvailableTargets] = useState<{ id: string, name: string }[]>([]);
    const [availableSubTargets, setAvailableSubTargets] = useState<{ id: string, name: string }[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);

    // ClickUp specific dropdowns
    const [clickupSpaces, setClickupSpaces] = useState<{ id: string, name: string }[]>([]);
    const [clickupFolders, setClickupFolders] = useState<{ id: string, name: string }[]>([]);
    const [clickupLists, setClickupLists] = useState<{ id: string, name: string }[]>([]);
    const [loadingClickup, setLoadingClickup] = useState(false);

    useEffect(() => {
        if (!isCreateModalOpen) return;

        const fetchTargets = async () => {
            setLoadingTargets(true);
            setAvailableTargets([]);
            setAvailableSubTargets([]);

            try {
                let targets: any[] = [];
                console.log(`Fetching targets for ${newTask.platform}...`);

                if (newTask.platform === 'jira') {
                    const res: any = await apiService.executeMCPTool('jira_issue_tracking', { action: 'get_projects' });
                    console.log('Jira projects:', res);
                    if (res && res.result && res.result.data && res.result.data.projects) {
                        targets = res.result.data.projects.map((p: any) => ({ id: p.key, name: p.name }));
                    }
                } else if (newTask.platform === 'trello') {
                    const res = await apiService.executeMCPTool('trello_project_management', { action: 'get_boards' });
                    console.log('Trello boards:', res);
                    if (res && res.result && res.result.data && res.result.data.boards) {
                        targets = res.result.data.boards.map((b: any) => ({ id: b.id, name: b.name }));
                    }
                } else if (newTask.platform === 'asana') {
                    const res = await apiService.executeMCPTool('asana_list_projects', {});
                    console.log('Asana projects:', res);
                    if (res && res.result && res.result.data && res.result.data.data) {
                        targets = res.result.data.data.map((p: any) => ({ id: p.gid || p.id, name: p.name }));
                    }
                } else if (newTask.platform === 'clickup') {
                    const res: any = await apiService.executeMCPTool('clickup_task_management', { operation: 'get_teams' });
                    console.log('ClickUp teams:', res);
                    if (res && res.result && res.result.teams) {
                        targets = res.result.teams.map((t: any) => ({ id: t.id, name: t.name }));
                    }
                }
                setAvailableTargets(targets);
            } catch (error) {
                console.error("Error fetching targets:", error);
            } finally {
                setLoadingTargets(false);
            }
        };

        fetchTargets();
    }, [newTask.platform, isCreateModalOpen]);

    useEffect(() => {
        if (newTask.platform !== 'trello' || !newTask.targetId) return;

        const fetchSubTargets = async () => {
            setLoadingTargets(true);
            try {
                console.log(`Fetching lists for board ${newTask.targetId}...`);
                const res: any = await apiService.executeMCPTool('trello_project_management', {
                    action: 'get_lists',
                    board_id: newTask.targetId
                });
                console.log('Trello lists full response:', res);
                console.log('res.result:', res?.result);
                console.log('res.result.data:', res?.result?.data);
                console.log('res.result.data.lists:', res?.result?.data?.lists);

                let lists: any[] = [];
                // Try multiple possible response structures
                if (res?.result?.data?.lists) {
                    lists = res.result.data.lists;
                } else if (res?.result?.lists) {
                    lists = res.result.lists;
                } else if (res?.data?.lists) {
                    lists = res.data.lists;
                } else if (res?.lists) {
                    lists = res.lists;
                }

                console.log('Extracted lists:', lists);

                if (lists.length > 0) {
                    setAvailableSubTargets(lists.map((l: any) => ({ id: l.id, name: l.name })));
                } else {
                    console.warn('No lists found in any known response structure');
                }
            } catch (error) {
                console.error("Error fetching sub-targets:", error);
            } finally {
                setLoadingTargets(false);
            }
        };

        fetchSubTargets();
    }, [newTask.targetId, newTask.platform]);

    // ClickUp: Fetch Spaces when Team is selected
    useEffect(() => {
        if (newTask.platform !== 'clickup' || !newTask.targetId) return;

        const fetchClickupSpaces = async () => {
            setLoadingClickup(true);
            setClickupSpaces([]);
            setClickupFolders([]);
            setClickupLists([]);
            setNewTask(prev => ({ ...prev, clickupSpaceId: '', clickupFolderId: '', clickupListId: '' }));

            try {
                console.log(`Fetching ClickUp spaces for team ${newTask.targetId}...`);
                const res: any = await apiService.executeMCPTool('clickup_resource_management', {
                    operation: 'get_spaces',
                    team_id: newTask.targetId
                });
                console.log('ClickUp spaces:', res);
                if (res?.result?.spaces || res?.spaces) {
                    const spaces = res?.result?.spaces || res?.spaces || [];
                    setClickupSpaces(spaces.map((s: any) => ({ id: s.id, name: s.name })));
                }
            } catch (error) {
                console.error("Error fetching ClickUp spaces:", error);
            } finally {
                setLoadingClickup(false);
            }
        };

        fetchClickupSpaces();
    }, [newTask.targetId, newTask.platform]);

    // ClickUp: Fetch Folders when Space is selected
    useEffect(() => {
        if (newTask.platform !== 'clickup' || !newTask.clickupSpaceId) return;

        const fetchClickupFolders = async () => {
            setLoadingClickup(true);
            setClickupFolders([]);
            setClickupLists([]);
            setNewTask(prev => ({ ...prev, clickupFolderId: '', clickupListId: '' }));

            try {
                console.log(`Fetching ClickUp folders for space ${newTask.clickupSpaceId}...`);
                const res: any = await apiService.executeMCPTool('clickup_resource_management', {
                    operation: 'get_folders',
                    space_id: newTask.clickupSpaceId
                });
                console.log('ClickUp folders:', res);

                const folders = res?.result?.folders || res?.folders || [];
                // Add a "No Folder" option for folderless lists
                const folderOptions = [{ id: '__folderless__', name: '(No Folder - Direct Lists)' }, ...folders.map((f: any) => ({ id: f.id, name: f.name }))];
                setClickupFolders(folderOptions);
            } catch (error) {
                console.error("Error fetching ClickUp folders:", error);
            } finally {
                setLoadingClickup(false);
            }
        };

        fetchClickupFolders();
    }, [newTask.clickupSpaceId, newTask.platform]);

    // ClickUp: Fetch Lists when Folder is selected (or folderless lists)
    useEffect(() => {
        if (newTask.platform !== 'clickup' || !newTask.clickupFolderId) return;

        const fetchClickupLists = async () => {
            setLoadingClickup(true);
            setClickupLists([]);
            setNewTask(prev => ({ ...prev, clickupListId: '' }));

            try {
                let res: any;
                if (newTask.clickupFolderId === '__folderless__') {
                    // Fetch folderless lists from space
                    console.log(`Fetching ClickUp folderless lists for space ${newTask.clickupSpaceId}...`);
                    res = await apiService.executeMCPTool('clickup_resource_management', {
                        operation: 'get_folderless_lists',
                        space_id: newTask.clickupSpaceId
                    });
                } else {
                    // Fetch lists from folder
                    console.log(`Fetching ClickUp lists for folder ${newTask.clickupFolderId}...`);
                    res = await apiService.executeMCPTool('clickup_resource_management', {
                        operation: 'get_lists',
                        folder_id: newTask.clickupFolderId
                    });
                }
                console.log('ClickUp lists:', res);

                const lists = res?.result?.lists || res?.lists || [];
                setClickupLists(lists.map((l: any) => ({ id: l.id, name: l.name })));
            } catch (error) {
                console.error("Error fetching ClickUp lists:", error);
            } finally {
                setLoadingClickup(false);
            }
        };

        fetchClickupLists();
    }, [newTask.clickupFolderId, newTask.clickupSpaceId, newTask.platform]);

    const handleCreateTask = async () => {
        setCreating(true);
        try {
            let result;
            if (newTask.platform === 'jira') {
                console.log('Creating Jira issue with:', {
                    project_key: newTask.targetId,
                    summary: newTask.title,
                    description: newTask.description,
                    issuetype: newTask.jiraIssueType,
                    status: newTask.jiraStatus
                });
                result = await apiService.executeMCPTool('jira_issue_tracking', {
                    action: 'create_issue',
                    project_key: newTask.targetId,
                    summary: newTask.title,
                    description: newTask.description,
                    issuetype: newTask.jiraIssueType,
                    status: newTask.jiraStatus
                });
                console.log('Jira create_issue response:', result);
            } else if (newTask.platform === 'trello') {
                if (!newTask.subTargetId) {
                    alert('Please select a List');
                    setCreating(false);
                    return;
                }
                result = await apiService.executeMCPTool('trello_project_management', {
                    action: 'create_card',
                    list_id: newTask.subTargetId,
                    name: newTask.title,
                    desc: newTask.description,
                    due: newTask.dueDate
                });
            } else if (newTask.platform === 'clickup') {
                if (!newTask.clickupListId) {
                    alert('Please select a List');
                    setCreating(false);
                    return;
                }
                result = await apiService.executeMCPTool('clickup_task_management', {
                    operation: 'create_task',
                    list_id: newTask.clickupListId,
                    name: newTask.title,
                    description: newTask.description
                });
            } else if (newTask.platform === 'asana') {
                result = await apiService.executeMCPTool('asana_create_task', {
                    project_id: newTask.targetId,
                    name: newTask.title,
                    notes: newTask.description
                });
            }

            // Check success - handle nested response structure
            console.log('Full create task result:', result);

            // Determine success more carefully
            const isSuccess = result && (
                result.success === true ||
                result.data?.success === true ||
                result.result?.success === true ||
                result.result?.data?.success === true
            );

            // Check for hidden errors
            const hasError = result?.error || result?.result?.error || result?.result?.data?.error;

            if (isSuccess && !hasError) {
                setIsCreateModalOpen(false);
                setNewTask({ platform: 'jira', title: '', description: '', targetId: '', subTargetId: '', dueDate: '', jiraIssueType: 'Task', jiraStatus: 'To Do', clickupSpaceId: '', clickupFolderId: '', clickupListId: '' });
                fetchTasks(); // Refresh list
                alert('Task created successfully!');
            } else {
                const errorMsg = result?.error || result?.result?.error || result?.result?.data?.error || 'Unknown error';
                alert('Failed to create task: ' + errorMsg);
                console.error('Task creation failed:', result);
            }

        } catch (error) {
            console.error('Create task error:', error);
            alert('Error creating task');
        } finally {
            setCreating(false);
        }
    };

    const handleTaskMove = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done', platform: string, project?: string) => {
        // Optimistic update
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const oldStatus = tasks[taskIndex].status;
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: newStatus };
        setTasks(updatedTasks);

        try {
            console.log(`Moving task ${taskId} (${platform}) to ${newStatus}`);
            let result;

            if (platform === 'jira') {
                const statusMap: Record<string, string> = {
                    'todo': 'To Do',
                    'in_progress': 'In Progress',
                    'review': 'In Review',
                    'done': 'Done'
                };
                result = await apiService.executeMCPTool('jira_issue_tracking', {
                    action: 'update_issue',
                    issue_key: taskId,
                    status: statusMap[newStatus]
                });
            } else if (platform === 'clickup') {
                const statusMap: Record<string, string> = {
                    'todo': 'to do',
                    'in_progress': 'in progress',
                    'review': 'review',
                    'done': 'complete' // ClickUp 'complete' or 'closed'
                };
                result = await apiService.executeMCPTool('clickup_task_management', {
                    operation: 'update_task',
                    task_id: taskId,
                    status: statusMap[newStatus]
                });
            } else if (platform === 'trello') {
                // Find the task to get the board ID
                const task = tasks.find(t => t.id === taskId);
                if (!task || !task.boardId) {
                    console.warn('Trello move failed: Missing board ID');
                    throw new Error('Missing board ID for Trello task');
                }

                // Fetch lists for this board
                console.log(`Fetching lists for board ${task.boardId} to find target...`);
                const listsRes: any = await apiService.executeMCPTool('trello_project_management', {
                    action: 'get_lists',
                    board_id: task.boardId
                });

                const lists = listsRes?.result?.data?.lists || listsRes?.result?.lists || listsRes?.data?.lists || [];
                if (!Array.isArray(lists) || lists.length === 0) {
                    throw new Error('Could not fetch lists for board');
                }

                // Find target list based on name matching
                // "To Do", "In Progress", "In Review", "Done"
                const targetStatusLower = newStatus.toLowerCase(); // 'todo', 'in_progress', 'review', 'done'

                let targetListId = '';

                for (const list of lists) {
                    const name = list.name.toLowerCase();
                    // Match logic
                    let isMatch = false;
                    if (targetStatusLower === 'done') {
                        isMatch = name.includes('done') || name.includes('complete') || name.includes('closed');
                    } else if (targetStatusLower === 'in_progress') {
                        isMatch = name.includes('progress') || name.includes('doing') || name.includes('working') || name.includes('current');
                    } else if (targetStatusLower === 'review') {
                        isMatch = name.includes('review') || name.includes('testing') || name.includes('qa');
                    } else if (targetStatusLower === 'todo') {
                        isMatch = name.includes('to do') || name.includes('todo') || name.includes('backlog') || name.includes('open');
                    }

                    if (isMatch) {
                        targetListId = list.id;
                        break;
                    }
                }

                // If no direct match is found, fallback?
                // Maybe if "To Do", pick first list? if "Done", pick last?
                // For now, if not found, we can't move.
                if (!targetListId) {
                    console.warn(`Could not find a matching list for status ${newStatus} on board ${task.boardId}`);
                    // Try strict exact matches if fuzzy failed? Or just error.
                    // Let's try to map "todo" to the first list if we really can't find one? 
                    // No, that's risky.
                    throw new Error(`No list found on board matching "${newStatus}"`);
                }

                console.log(`Found target list ${targetListId} for status ${newStatus}`);

                result = await apiService.executeMCPTool('tool_executor', {
                    tool_name: 'trello_project_management',
                    arguments: {
                        action: 'update_card',
                        card_id: taskId,
                        list_id: targetListId
                    }
                });
                // Note: executeMCPTool usually takes toolName + args directly. 
                // My apiService usage in this file is `executeMCPTool('tool_name', args)`
                // So:
                result = await apiService.executeMCPTool('trello_project_management', {
                    action: 'update_card',
                    card_id: taskId,
                    list_id: targetListId
                });
            }

            console.log('Move result:', result);
            if (result && !result.success && !result.result?.success) {
                throw new Error('Backend reported failure');
            }

        } catch (error) {
            console.error('Failed to move task:', error);
            // Revert on failure
            updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: oldStatus };
            setTasks([...updatedTasks]);
            alert('Failed to update task status');
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: 'todo' | 'in_progress' | 'review' | 'done') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== status) {
            handleTaskMove(taskId, status, task.platform, task.project);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-gray-800 overflow-hidden relative">
            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">Create New Task</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Platform</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['jira', 'trello', 'clickup', 'asana'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setNewTask({ ...newTask, platform: p, targetId: '', subTargetId: '', jiraIssueType: 'Task', jiraStatus: 'To Do', clickupSpaceId: '', clickupFolderId: '', clickupListId: '' })}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${newTask.platform === p ? 'bg-gray-900 text-white border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {getPlatformIcon(p)}
                                            <span className="text-[10px] font-bold mt-1 capitalize">{p}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    {newTask.platform === 'jira' ? 'Project' :
                                        newTask.platform === 'trello' ? 'Board' :
                                            newTask.platform === 'clickup' ? 'Team' : 'Project'}
                                    {loadingTargets && <span className="ml-2 text-gray-400 font-normal normal-case">(Loading...)</span>}
                                </label>

                                {availableTargets.length > 0 ? (
                                    <select
                                        value={newTask.targetId}
                                        onChange={e => setNewTask({ ...newTask, targetId: e.target.value, subTargetId: '' })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Select {newTask.platform === 'jira' ? 'Project' : 'Target'}...</option>
                                        {availableTargets.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={newTask.targetId}
                                        onChange={e => setNewTask({ ...newTask, targetId: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder={newTask.platform === 'jira' ? 'e.g. PROJ' : 'e.g. ID'}
                                    />
                                )}
                            </div>

                            {/* Jira Work Type Selection */}
                            {newTask.platform === 'jira' && newTask.targetId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Work Type
                                    </label>
                                    <select
                                        value={newTask.jiraIssueType}
                                        onChange={e => setNewTask({ ...newTask, jiraIssueType: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="Task">Task</option>
                                        <option value="Bug">Bug</option>
                                        <option value="Story">Story</option>
                                        <option value="Epic">Epic</option>
                                        <option value="Feature">Feature</option>
                                        <option value="Request">Request</option>
                                    </select>
                                </div>
                            )}

                            {/* Jira Status Selection */}
                            {newTask.platform === 'jira' && newTask.targetId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Status
                                    </label>
                                    <select
                                        value={newTask.jiraStatus}
                                        onChange={e => setNewTask({ ...newTask, jiraStatus: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                            )}

                            {/* Second Dropdown for Trello (List Selection) */}
                            {newTask.platform === 'trello' && newTask.targetId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                        List
                                        {loadingTargets && <span className="ml-2 text-gray-400 font-normal normal-case">(Loading...)</span>}
                                    </label>
                                    <select
                                        value={newTask.subTargetId}
                                        onChange={e => setNewTask({ ...newTask, subTargetId: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Select List...</option>
                                        {availableSubTargets.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* ClickUp Cascade Dropdowns */}
                            {newTask.platform === 'clickup' && newTask.targetId && (
                                <>
                                    {/* Space Selection */}
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                            Space
                                            {loadingClickup && <span className="ml-2 text-gray-400 font-normal normal-case">(Loading...)</span>}
                                        </label>
                                        <select
                                            value={newTask.clickupSpaceId}
                                            onChange={e => setNewTask({ ...newTask, clickupSpaceId: e.target.value, clickupFolderId: '', clickupListId: '' })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Select Space...</option>
                                            {clickupSpaces.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Folder Selection (optional) */}
                                    {newTask.clickupSpaceId && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Folder <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                                {loadingClickup && <span className="ml-2 text-gray-400 font-normal normal-case">(Loading...)</span>}
                                            </label>
                                            <select
                                                value={newTask.clickupFolderId}
                                                onChange={e => setNewTask({ ...newTask, clickupFolderId: e.target.value, clickupListId: '' })}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            >
                                                <option value="">Select Folder...</option>
                                                {clickupFolders.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* List Selection */}
                                    {newTask.clickupFolderId && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                                List
                                                {loadingClickup && <span className="ml-2 text-gray-400 font-normal normal-case">(Loading...)</span>}
                                            </label>
                                            <select
                                                value={newTask.clickupListId}
                                                onChange={e => setNewTask({ ...newTask, clickupListId: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            >
                                                <option value="">Select List...</option>
                                                {clickupLists.map(l => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Task Title</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="What needs to be done?"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    placeholder="Add details..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Due Date (Optional)</label>
                                <input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTask}
                                disabled={creating || !newTask.title || !newTask.targetId}
                                className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                {creating ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-200 shrink-0 z-20 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        Unified Tasks
                        {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all your work across varying platforms in one place.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center shrink-0">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="relative isolate overflow-hidden rounded-xl px-4 py-2 font-semibold text-white transition-all duration-300
                        bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700
                        before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-100
                        after:absolute after:inset-0 after:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]
                        shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
                        flex items-center gap-2 shrink-0 whitespace-nowrap text-sm group">
                        <Plus className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">New Task</span>
                    </button>
                    <button
                        onClick={fetchTasks}
                        className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar / Filters (Optional - Inline for now) */}

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Bento Grid Header */}
                    <div className="px-4 md:px-8 pt-6 pb-2">
                        <div className="flex overflow-x-auto pb-2 gap-4 mb-6 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:pb-0 sm:overflow-visible custom-scrollbar snap-x snap-mandatory">
                            {/* Summary Cards */}
                            {stats.map((stat, i) => (
                                <div key={i} className="min-w-[240px] sm:min-w-0 bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow snap-start">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 backdrop-blur-sm`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-').replace('text-white', '')}`} style={{ color: stat.color.includes('text-white') ? undefined : 'currentColor' }} />
                                    </div>
                                </div>
                            ))}
                            {/* Mini Chart */}
                            <div className="min-w-[240px] sm:min-w-0 bg-white p-1 rounded-2xl border border-gray-200/60 shadow-sm relative overflow-hidden flex items-center justify-center sm:col-span-1 lg:col-span-1 min-h-[100px] snap-start">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                    <PieChart width={100} height={100}>
                                        <Pie data={chartData} innerRadius={35} outerRadius={45} paddingAngle={2} dataKey="value">
                                            {chartData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </div>
                                <div className="text-center z-10">
                                    <span className="block text-xl font-bold text-gray-800">{Math.round((tasks.filter(t => t.status === 'done').length / (tasks.length || 1)) * 100)}%</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400">Completion</span>
                                </div>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar no-scrollbar-mobile">
                            <div className="relative shrink-0">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by name..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 shadow-sm transition-all"
                                />
                            </div>
                            <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />
                            <button
                                onClick={() => setActivePlatformFilter(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${!activePlatformFilter ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                            >
                                All
                            </button>
                            {['clickup', 'jira', 'trello', 'asana'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setActivePlatformFilter(p)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 capitalize shrink-0 ${activePlatformFilter === p ? 'bg-gray-100 text-gray-900 border-gray-300' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                    {getPlatformIcon(p)}
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kanban Board */}
                    {viewMode === 'kanban' && (
                        <div className="flex-1 overflow-x-auto custom-scrollbar px-4 md:px-8 pb-8">
                            <div className="flex gap-4 md:gap-6 h-full min-w-max">
                                {columns.map(col => {
                                    const colTasks = filteredTasks.filter(t => t.status === col.id);
                                    return (
                                        <div
                                            key={col.id}
                                            className="w-[280px] md:w-[320px] flex flex-col h-full shrink-0"
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, col.id as any)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                                    <h3 className="font-bold text-gray-700 text-sm">{col.label}</h3>
                                                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">{colTasks.length}</span>
                                                </div>
                                                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-4">
                                                {colTasks.length === 0 && (
                                                    <div className="border-2 border-dashed border-gray-100 rounded-xl h-24 flex items-center justify-center text-gray-300 text-xs font-medium">
                                                        No Tasks
                                                    </div>
                                                )}
                                                {colTasks.map(task => (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
                                                    >
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${col.dot}`} />

                                                        <div className="flex justify-between items-start mb-2 pl-2">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                                {getPlatformIcon(task.platform)}
                                                                <span className="capitalize">{task.platform}</span>
                                                            </div>
                                                            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                                                        </div>

                                                        <h4 className={`text-sm font-bold text-gray-800 mb-1 pl-2 leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>{task.description}</h4>

                                                        <div className="flex items-center gap-2 mb-3 pl-2">
                                                            <span className="text-[11px] font-medium text-gray-500 truncate max-w-[120px]">{task.project}</span>
                                                        </div>

                                                        <div className="flex items-center justify-between pl-2 pt-2 border-t border-gray-50">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {task.dueDate}
                                                            </div>
                                                            {task.priority && <PriorityBadge priority={task.priority} />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar overflow-x-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-w-[600px]">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4">Task</th>
                                            <th className="px-6 py-4">Platform</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Due Date</th>
                                            <th className="px-6 py-4 text-right">Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredTasks.map(task => (
                                            <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${columns.find(c => c.id === task.status)?.dot}`} />
                                                        <span className={task.status === 'done' ? 'line-through text-gray-400' : ''}>{task.description}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getPlatformIcon(task.platform)}
                                                        <span className="capitalize text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-md">{task.platform}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${task.status === 'done' ? 'bg-green-100 text-green-700' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                            task.status === 'review' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{task.dueDate}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <PriorityBadge priority={task.priority} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.3);
                    border-radius: 99px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.5);
                }
            `}</style>
        </div>
    );
};

export default UnifiedTaskView;
