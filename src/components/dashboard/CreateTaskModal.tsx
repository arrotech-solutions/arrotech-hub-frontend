import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    connections: any[];
    onTaskCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, connections, onTaskCreated }) => {
    const [loading, setLoading] = useState(false);

    // Hierarchy State
    const [spaces, setSpaces] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [lists, setLists] = useState<any[]>([]);

    // Selection State
    const [selectedSpace, setSelectedSpace] = useState<string>('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [selectedList, setSelectedList] = useState<string>('');

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Initialize with first available platform
    useEffect(() => {
        if (isOpen && connections.length > 0) {
            const clickup = connections.find(c => c.platform.toLowerCase() === 'clickup');
            if (clickup) {
                fetchSpaces(clickup);
            }
        }
    }, [isOpen, connections]);

    const fetchSpaces = async (connection: any) => {
        try {
            setLoading(true);
            const teamId = connection.config.teams?.[0]?.id;
            if (!teamId) return;

            const result = await apiService.executeMCPTool('clickup_resource_management', {
                operation: 'get_spaces',
                team_id: teamId
            });

            if (result.success && result.result?.spaces) {
                setSpaces(result.result.spaces);
            }
        } catch (error) {
            console.error('Failed to fetch spaces', error);
            toast.error('Failed to load ClickUp spaces');
        } finally {
            setLoading(false);
        }
    };

    const fetchFoldersAndLists = async (spaceId: string) => {
        setSelectedSpace(spaceId);
        setSelectedFolder('');
        setSelectedList('');

        // Reset downward hierarchy
        setFolders([]);
        setLists([]);

        const clickup = connections.find(c => c.platform.toLowerCase() === 'clickup');
        if (!clickup) return;

        try {
            setLoading(true);

            const [foldersRes, listsRes] = await Promise.all([
                apiService.executeMCPTool('clickup_resource_management', {
                    operation: 'get_folders',
                    space_id: spaceId
                }),
                apiService.executeMCPTool('clickup_resource_management', {
                    operation: 'get_folderless_lists',
                    space_id: spaceId
                })
            ]);

            if (foldersRes.success && foldersRes.result?.folders) {
                setFolders(foldersRes.result.folders);
            }
            if (listsRes.success && listsRes.result?.lists) {
                setLists(prev => [...prev, ...listsRes.result.lists]);
            }

        } catch (error) {
            console.error('Failed to fetch folders/lists', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchListsInFolder = async (folderId: string) => {
        setSelectedFolder(folderId);
        const clickup = connections.find(c => c.platform.toLowerCase() === 'clickup');
        if (!clickup) return;

        try {
            setLoading(true);
            const result = await apiService.executeMCPTool('clickup_resource_management', {
                operation: 'get_lists',
                folder_id: folderId
            });

            if (result.success && result.result?.lists) {
                setLists(result.result.lists);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedList || !title) {
            toast.error('Please select a list and enter a title');
            return;
        }

        try {
            setLoading(true);
            const result = await apiService.executeMCPTool('clickup_task_management', {
                operation: 'create_task',
                list_id: selectedList,
                name: title,
                description: description
            });

            if (result.success) {
                toast.success('Task created successfully!');
                onTaskCreated();
                onClose();
                // Reset form
                setTitle('');
                setDescription('');
            } else {
                toast.error('Failed to create task');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error creating task');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Create New Task</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Space Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Space</label>
                        <select
                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                            value={selectedSpace}
                            onChange={(e) => fetchFoldersAndLists(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Select Space...</option>
                            {spaces.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Folder Selection (Optional if lists exist in space) */}
                    {folders.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Folder (Optional)</label>
                            <select
                                className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                                value={selectedFolder}
                                onChange={(e) => fetchListsInFolder(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Select Folder...</option>
                                {folders.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* List Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">List</label>
                        <select
                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                            value={selectedList}
                            onChange={(e) => setSelectedList(e.target.value)}
                            disabled={loading || (!selectedSpace && !selectedFolder)}
                        >
                            <option value="">Select List...</option>
                            {lists.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Task Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                        <input
                            type="text"
                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                            rows={3}
                            placeholder="Add details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !title || !selectedList}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Create Task
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
