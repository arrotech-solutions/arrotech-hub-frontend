import React, { useEffect, useState } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import apiService from '../../services/api';
import toast from '../../lib/notify';

interface BroadcastDetailModalProps {
    broadcastId: string | null;
    onClose: () => void;
}

interface RecipientRow {
    id: string;
    contact_name: string;
    phone_number: string;
    status: string;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    error_message?: string;
}

const BroadcastDetailModal: React.FC<BroadcastDetailModalProps> = ({ broadcastId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<any>(null);
    const [recipients, setRecipients] = useState<RecipientRow[]>([]);

    useEffect(() => {
        if (!broadcastId) return;
        const load = async () => {
            setLoading(true);
            try {
                const [detailResp, recipientsResp] = await Promise.all([
                    apiService.getWhatsAppBroadcast(broadcastId),
                    apiService.getWhatsAppBroadcastRecipients(broadcastId, { limit: 100 }),
                ]);
                if (detailResp.success) setDetail(detailResp.data);
                if (recipientsResp.success) {
                    setRecipients(Array.isArray(recipientsResp.data) ? recipientsResp.data : []);
                }
            } catch {
                toast.error('Failed to load campaign details');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [broadcastId]);

    if (!broadcastId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-5 border-b dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {detail?.name || 'Campaign Details'}
                        </h2>
                        {detail?.status && (
                            <span className="text-xs uppercase font-semibold text-slate-500">{detail.status}</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <>
                            {detail && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="text-slate-500">Recipients</div>
                                        <div className="font-bold">{detail.total_recipients}</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="text-slate-500">Sent</div>
                                        <div className="font-bold">{detail.sent_count}</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="text-slate-500">Delivered</div>
                                        <div className="font-bold">{detail.delivered_count}</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="text-slate-500">Read</div>
                                        <div className="font-bold">{detail.read_count}</div>
                                    </div>
                                </div>
                            )}

                            {detail?.text_content && (
                                <div className="p-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-sm whitespace-pre-wrap">
                                    {detail.text_content}
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4" /> Recipients
                                </h3>
                                <div className="divide-y dark:divide-slate-800 border dark:border-slate-800 rounded-xl overflow-hidden">
                                    {recipients.length === 0 ? (
                                        <p className="p-4 text-sm text-slate-500">No recipient records yet.</p>
                                    ) : (
                                        recipients.map((r) => (
                                            <div key={r.id} className="p-3 flex justify-between gap-3 text-sm">
                                                <div>
                                                    <div className="font-medium">{r.contact_name}</div>
                                                    <div className="text-slate-500">{r.phone_number}</div>
                                                    {r.error_message && (
                                                        <div className="text-red-500 text-xs mt-1">{r.error_message}</div>
                                                    )}
                                                </div>
                                                <span className="text-xs uppercase font-bold text-slate-500">{r.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BroadcastDetailModal;
