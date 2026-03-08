import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Building2, ChevronDown, User, Plus, Check, Settings } from 'lucide-react';

/**
 * OrgSwitcher – a dropdown in the sidebar/header to switch between
 * Personal context and organization contexts.
 */
const OrgSwitcher = () => {
    const { organizations, activeOrg, switchOrg } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSwitch = async (orgId: number | null) => {
        setOpen(false);
        try { await switchOrg(orgId); } catch { }
    };

    return (
        <div ref={ref} className="relative select-none">
            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 text-gray-700 dark:text-slate-200 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700/60 transition-colors"
            >
                <span className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    {activeOrg ? (
                        activeOrg.logo_url ? (
                            <img src={activeOrg.logo_url} alt="" className="w-5 h-5 rounded flex-shrink-0" />
                        ) : (
                            <Building2 size={16} className="text-emerald-500 flex-shrink-0" />
                        )
                    ) : (
                        <User size={16} className="text-indigo-400 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">
                        {activeOrg ? activeOrg.name : 'Personal'}
                    </span>
                </span>
                <ChevronDown size={14} className={`transition-transform flex-shrink-0 text-gray-400 dark:text-slate-500 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-[999] overflow-hidden">
                    {/* Personal */}
                    <div
                        onClick={() => handleSwitch(null)}
                        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer text-sm border-b border-gray-100 dark:border-slate-700/50 transition-colors ${!activeOrg
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        <User size={15} className="text-indigo-400" />
                        <span className="flex-1">Personal</span>
                        {!activeOrg && <Check size={14} className="text-indigo-500" />}
                    </div>

                    {/* Org list */}
                    {organizations.map(org => (
                        <div
                            key={org.id}
                            onClick={() => handleSwitch(org.id)}
                            className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer text-sm border-b border-gray-100 dark:border-slate-700/50 transition-colors ${activeOrg?.id === org.id
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            {org.logo_url ? (
                                <img src={org.logo_url} alt="" className="w-[18px] h-[18px] rounded-sm" />
                            ) : (
                                <Building2 size={15} className="text-emerald-500" />
                            )}
                            <span className="flex-1 truncate">{org.name}</span>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 capitalize">{org.role}</span>
                            {activeOrg?.id === org.id && <Check size={14} className="text-emerald-500" />}
                        </div>
                    ))}

                    {/* Org Settings (only when an org is active) */}
                    {activeOrg && (
                        <div
                            onClick={() => { setOpen(false); navigate('/org/settings'); }}
                            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer text-gray-500 dark:text-slate-400 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700/50 transition-colors"
                        >
                            <Settings size={15} />
                            <span>Organization Settings</span>
                        </div>
                    )}

                    {/* Create new */}
                    <div
                        onClick={() => { setOpen(false); navigate('/create-organization'); }}
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer text-gray-500 dark:text-slate-400 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <Plus size={15} />
                        <span>Create Organization</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgSwitcher;
