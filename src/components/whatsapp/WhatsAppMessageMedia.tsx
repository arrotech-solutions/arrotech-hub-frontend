import React, { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import apiService from '../../services/api';

interface Props {
    messageId: number;
    messageType: string;
    mediaUrl: string | null;
}

const WhatsAppMessageMedia: React.FC<Props> = ({ messageId, messageType, mediaUrl }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!mediaUrl) return;

        const needsAuth =
            mediaUrl.startsWith('/api/whatsapp/messages/') ||
            /^\d+$/.test(mediaUrl);

        if (!needsAuth) {
            setBlobUrl(mediaUrl);
            return;
        }

        let revoked: string | null = null;
        setLoading(true);
        setError(false);
        apiService
            .fetchWhatsAppMessageMediaBlob(messageId)
            .then((url) => {
                revoked = url;
                setBlobUrl(url);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));

        return () => {
            if (revoked) URL.revokeObjectURL(revoked);
        };
    }, [messageId, mediaUrl]);

    if (!mediaUrl) return null;

    if (loading) {
        return (
            <div className="mb-2 flex items-center gap-2 text-xs opacity-70">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading media…
            </div>
        );
    }

    if (error || !blobUrl) {
        return (
            <div className="mb-2 text-xs opacity-70 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Media unavailable
            </div>
        );
    }

    if (messageType === 'image') {
        return (
            <div className="mb-2">
                <img src={blobUrl} alt="Media" className="rounded-lg max-w-full max-h-64 object-cover" />
            </div>
        );
    }

    return (
        <div className="mb-2">
            <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-white/20 dark:bg-slate-700/50 rounded-lg hover:bg-white/30 transition-colors"
            >
                <FileText className="w-5 h-5" />
                <span className="text-sm underline">View attachment</span>
            </a>
        </div>
    );
};

export default WhatsAppMessageMedia;
