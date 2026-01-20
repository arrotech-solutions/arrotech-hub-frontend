import React from 'react';
import { Github, Music, Disc, Cloud, ArrowRight, Plus } from 'lucide-react';

const ConnectHubWidget: React.FC = () => {
    return (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl p-6 flex flex-col justify-between group h-full transition-all hover:bg-white/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Connect Hub</h3>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">New</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <div className="aspect-square bg-white/60 hover:bg-white rounded-xl border border-white/60 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-center group/icon">
                    <Github className="w-5 h-5 text-gray-700 group-hover/icon:text-black transition-colors" />
                </div>
                <div className="aspect-square bg-white/60 hover:bg-white rounded-xl border border-white/60 hover:border-green-200 transition-all cursor-pointer flex items-center justify-center group/icon">
                    <Music className="w-5 h-5 text-gray-700 group-hover/icon:text-green-500 transition-colors" />
                </div>
                <div className="aspect-square bg-white/60 hover:bg-white rounded-xl border border-white/60 hover:border-purple-200 transition-all cursor-pointer flex items-center justify-center group/icon">
                    <Disc className="w-5 h-5 text-gray-700 group-hover/icon:text-purple-500 transition-colors" />
                </div>
                <div className="aspect-square bg-dashed border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center justify-center text-indigo-400">
                    <Plus className="w-5 h-5" />
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100/50 flex items-center justify-between cursor-pointer hover:opacity-75 transition-opacity">
                <div className="text-xs font-semibold text-gray-500">View All Integrations</div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </div>
        </div>
    );
};

export default ConnectHubWidget;
