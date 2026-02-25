import React from 'react';
import { FileText, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface DataPrivacySettingsProps {
    onExport: () => void;
    onDelete: () => void;
    expanded?: boolean;
    onToggle?: () => void;
}

const DataPrivacySettings: React.FC<DataPrivacySettingsProps> = ({
    onExport,
    onDelete,
    expanded = true,
    onToggle
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
                        <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Data & Privacy</h3>
                        <p className="text-gray-600 dark:text-slate-400 transition-colors">Manage your personal data and account existence</p>
                    </div>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition-colors"
                    >
                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Data Export */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Download className="w-5 h-5 text-slate-600 dark:text-slate-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Export Your Data</h4>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">
                                Download a copy of your personal data, including your profile, settings, and activity logs, in JSON format.
                                This allows you to transfer your data to another service.
                            </p>
                            <button
                                onClick={onExport}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-medium flex items-center space-x-2 shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-6 border border-red-100 dark:border-red-900/30 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h4 className="text-lg font-bold text-red-700 dark:text-red-400">Delete Account</h4>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-red-800 dark:text-red-300/80 transition-colors">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <button
                                onClick={onDelete}
                                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete My Account</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataPrivacySettings;
