import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface AccessRequest {
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    approved_at?: string;
    name?: string;
    reason?: string;
}

const AdminDashboard: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getAccessRequests(filter);
            if (response.success) {
                setRequests(response.data);
            }
        } catch (error: any) {
            console.error('Failed to fetch requests:', error);
            if (error.response?.status === 403) {
                toast.error("Unauthorized: Admin access required");
                navigate('/');
            } else {
                toast.error("Failed to load requests");
            }
        } finally {
            setIsLoading(false);
        }
    }, [filter, navigate]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (email: string, action: 'approve' | 'reject') => {
        try {
            await apiService.approveAccess(email, action);
            toast.success(`Request ${action}d successfully`);
            fetchRequests(); // Refresh list
        } catch (error) {
            toast.error("Failed to process request");
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Logged in as <b>{user?.email}</b></span>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tabs */}
                <div className="flex gap-4 mb-8 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit">
                    {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No {filter} requests found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {requests.map((req) => (
                                        <tr key={req.email} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{req.email}</div>
                                                {req.name && <div className="text-sm text-gray-500">{req.name}</div>}
                                                {req.reason && <div className="text-xs text-gray-400 mt-1 italic">"{req.reason}"</div>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(req.email, 'approve')}
                                                            className="text-green-600 hover:text-green-900 hover:bg-green-50 px-3 py-1 rounded transition-colors text-sm font-medium"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.email, 'reject')}
                                                            className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors text-sm font-medium"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleAction(req.email, 'approve')}
                                                        className="text-green-600 hover:text-green-900 hover:bg-green-50 px-3 py-1 rounded transition-colors text-sm font-medium"
                                                    >
                                                        Re-Approve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
