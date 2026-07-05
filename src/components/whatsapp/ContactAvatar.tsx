import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../../services/api';

export interface ContactAvatarContact {
    id: number | string;
    phone_number: string;
    name?: string | null;
    profile_name?: string | null;
    avatar_url?: string | null;
}

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<AvatarSize, string> = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-3xl',
};

const AVATAR_PALETTES = [
    ['from-violet-500', 'to-purple-700'],
    ['from-blue-500', 'to-indigo-700'],
    ['from-cyan-500', 'to-teal-700'],
    ['from-emerald-500', 'to-green-700'],
    ['from-amber-500', 'to-orange-700'],
    ['from-rose-500', 'to-pink-700'],
    ['from-fuchsia-500', 'to-purple-700'],
    ['from-sky-500', 'to-blue-700'],
    ['from-lime-500', 'to-emerald-700'],
    ['from-red-500', 'to-rose-700'],
];

function hashPhone(phone: string): number {
    let hash = 0;
    const value = phone || '';
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getContactDisplayName(contact: ContactAvatarContact): string {
    return contact.name || contact.profile_name || contact.phone_number || '?';
}

export function getContactInitials(contact: ContactAvatarContact): string {
    const display = getContactDisplayName(contact);
    const parts = display.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && !/^\d+$/.test(parts[0])) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    if (/^\d+$/.test(display)) {
        return display.slice(-2);
    }
    return display.slice(0, 2).toUpperCase();
}

export function getContactPalette(contact: ContactAvatarContact): [string, string] {
    const index = hashPhone(contact.phone_number) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[index] as [string, string];
}

interface ContactAvatarProps {
    contact: ContactAvatarContact;
    size?: AvatarSize;
    className?: string;
    showRing?: boolean;
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
    contact,
    size = 'md',
    className = '',
    showRing = true,
}) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    const hasAvatar = Boolean(contact.avatar_url) && !failed;
    const initials = useMemo(() => getContactInitials(contact), [contact]);
    const [from, to] = useMemo(() => getContactPalette(contact), [contact]);

    useEffect(() => {
        let active = true;
        let objectUrl: string | null = null;

        const load = async () => {
            if (!contact.avatar_url) {
                setBlobUrl(null);
                setFailed(false);
                return;
            }
            try {
                const url = await apiService.fetchWhatsAppContactAvatarBlob(contact.id);
                if (!active) return;
                objectUrl = url;
                setBlobUrl(url);
                setFailed(false);
            } catch {
                if (active) {
                    setFailed(true);
                    setBlobUrl(null);
                }
            }
        };

        load();

        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [contact.id, contact.avatar_url]);

    const ringClass = showRing ? 'ring-2 ring-white dark:ring-slate-900' : '';

    if (hasAvatar && blobUrl) {
        return (
            <img
                src={blobUrl}
                alt={getContactDisplayName(contact)}
                className={`${SIZE_CLASSES[size]} rounded-full object-cover shadow-sm ${ringClass} ${className}`}
            />
        );
    }

    return (
        <div
            className={`${SIZE_CLASSES[size]} rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-bold shadow-sm ${ringClass} ${className}`}
            aria-hidden
        >
            {initials}
        </div>
    );
};

export default ContactAvatar;
