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
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">Data & Privacy</h3>
                        <p className="text-gray-600">Manage your personal data and account existence</p>
                    </div>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Data Export */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <Download className="w-5 h-5 text-slate-600" />
                            <h4 className="text-lg font-medium text-gray-900">Export Your Data</h4>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Download a copy of your personal data, including your profile, settings, and activity logs, in JSON format.
                                This allows you to transfer your data to another service.
                            </p>
                            <button
                                onClick={onExport}
                                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-medium flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div className="bg-red-50 rounded-lg p-6 border border-red-100">
                        <div className="flex items-center space-x-3 mb-4">
                            <Trash2 className="w-5 h-5 text-red-600" />
                            <h4 className="text-lg font-bold text-red-700">Delete Account</h4>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-red-800">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <button
                                onClick={onDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2 shadow-sm"
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
