import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ClipboardList,
    ExternalLink,
    Loader2,
    MessageCircle,
    RefreshCw,
    Users,
} from 'lucide-react';
import toast from '../lib/notify';
import { mapApiError } from '../lib/mapApiError';
import apiService from '../services/api';

type OpsTab = 'orders' | 'reservations';

interface LineItem {
    name?: string;
    qty?: number | string;
    quantity?: number | string;
    price?: number | string;
    unit_price?: number | string;
}

interface CommerceOrder {
    external_order_id?: string;
    order_id?: string;
    status?: string;
    payment_status?: string;
    total?: string | number;
    currency?: string;
    customer_name?: string;
    customer_phone?: string;
    whatsapp_url?: string;
    line_items?: LineItem[];
    items?: LineItem[];
    delivery_method?: string;
    delivery_address?: string;
    notes?: string;
    mpesa_receipt?: string;
    allowed_statuses?: string[];
    created_at?: string;
}

interface CommerceReservation {
    external_reservation_id?: string;
    reservation_id?: string;
    customer_name?: string;
    customer_phone?: string;
    whatsapp_url?: string;
    reservation_date?: string;
    reservation_time?: string;
    party_size?: number;
    status?: string;
    notes?: string;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    shipped: ['out_for_delivery', 'delivered', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: ['refunded'],
    refunded: [],
};

function orderId(order: CommerceOrder): string {
    return String(order.external_order_id || order.order_id || '');
}

function reservationId(reservation: CommerceReservation): string {
    return String(reservation.external_reservation_id || reservation.reservation_id || '');
}

function waMeLink(phone?: string, fallback?: string): string {
    if (fallback && fallback.startsWith('https://wa.me/')) return fallback;
    const digits = String(phone || '').replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '';
}

function labelStatus(value?: string): string {
    return String(value || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase()) || '—';
}

function money(total?: string | number, currency?: string): string {
    if (total == null || total === '') return '—';
    const amount = typeof total === 'number' ? total.toFixed(2) : String(total);
    return `${currency || 'KES'} ${amount}`;
}

function lineItems(order: CommerceOrder): LineItem[] {
    const items = order.line_items || order.items || [];
    return Array.isArray(items) ? items : [];
}

function allowedStatuses(order: CommerceOrder): string[] {
    if (Array.isArray(order.allowed_statuses)) return order.allowed_statuses;
    return STATUS_TRANSITIONS[String(order.status || '').toLowerCase()] || [];
}

function statusTone(value?: string): string {
    const key = String(value || '').toLowerCase();
    if (key === 'paid' || key === 'delivered' || key === 'confirmed' || key === 'ready') {
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    }
    if (key === 'cancelled' || key === 'refunded' || key === 'failed') {
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
    }
    if (key === 'pending') {
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    }
    return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
}

const CommerceOrders: React.FC = () => {
    const [tab, setTab] = useState<OpsTab>('orders');
    const [orders, setOrders] = useState<CommerceOrder[]>([]);
    const [reservations, setReservations] = useState<CommerceReservation[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    const selected = useMemo(
        () => orders.find((order) => orderId(order) === selectedId) || null,
        [orders, selectedId]
    );

    const load = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true);
        else setLoading(true);
        try {
            const [orderRes, reservationRes] = await Promise.all([
                apiService.listCommerceOrders(),
                apiService.listCommerceReservations(),
            ]);
            const nextOrders = orderRes?.data?.orders || [];
            const nextReservations = reservationRes?.data?.reservations || [];
            setOrders(nextOrders);
            setReservations(nextReservations);
            setSelectedId((current) => {
                if (current && nextOrders.some((order) => orderId(order) === current)) {
                    return current;
                }
                return nextOrders[0] ? orderId(nextOrders[0]) : '';
            });
        } catch (error) {
            toast.error(mapApiError(error, 'Could not load orders'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const refreshSelected = useCallback(async (id: string) => {
        try {
            const response = await apiService.getCommerceOrder(id);
            const detail = response?.data;
            if (!detail) return;
            setOrders((prev) =>
                prev.map((order) => (orderId(order) === id ? { ...order, ...detail } : order))
            );
        } catch (error) {
            toast.error(mapApiError(error, 'Could not load order'));
        }
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        void refreshSelected(selectedId);
    }, [selectedId, refreshSelected]);

    const changeStatus = async (nextStatus: string) => {
        if (!selectedId) return;
        setUpdating(true);
        try {
            const response = await apiService.updateCommerceOrderStatus(selectedId, nextStatus);
            const updated = response?.data;
            if (updated) {
                setOrders((prev) =>
                    prev.map((order) =>
                        orderId(order) === selectedId ? { ...order, ...updated } : order
                    )
                );
            }
            toast.success(`Order marked ${labelStatus(nextStatus).toLowerCase()}`);
        } catch (error) {
            toast.error(mapApiError(error, 'Could not update order status'));
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-800 to-primary-500 flex items-center justify-center shadow-lg">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Orders</h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Review payment state, contact customers, and move order status.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => void load(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <div className="flex gap-2 mb-6">
                    {([
                        ['orders', 'Orders', orders.length],
                        ['reservations', 'Reservations', reservations.length],
                    ] as const).map(([key, label, count]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                tab === key
                                    ? 'bg-secondary-800 text-white'
                                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                            }`}
                        >
                            {label} ({count})
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24 text-gray-500 dark:text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading…
                    </div>
                ) : tab === 'orders' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                            {orders.length === 0 ? (
                                <div className="p-8 text-sm text-gray-500 dark:text-slate-400">
                                    No orders yet. WhatsApp commerce orders will appear here.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {orders.map((order) => {
                                        const id = orderId(order);
                                        const active = id === selectedId;
                                        return (
                                            <li key={id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedId(id)}
                                                    className={`w-full text-left px-4 py-4 ${
                                                        active
                                                            ? 'bg-blue-50/80 dark:bg-blue-500/10'
                                                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/70'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {order.customer_name || 'Customer'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                                {id}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {money(order.total, order.currency)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusTone(order.status)}`}>
                                                            {labelStatus(order.status)}
                                                        </span>
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusTone(order.payment_status)}`}>
                                                            {labelStatus(order.payment_status)}
                                                        </span>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6">
                            {!selected ? (
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Select an order to see line items, customer contact, and status actions.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {selected.customer_name}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                {orderId(selected)} · {money(selected.total, selected.currency)}
                                            </p>
                                        </div>
                                        {waMeLink(selected.customer_phone, selected.whatsapp_url) && (
                                            <a
                                                href={waMeLink(selected.customer_phone, selected.whatsapp_url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-700"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                WhatsApp
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusTone(selected.status)}`}>
                                            {labelStatus(selected.status)}
                                        </span>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusTone(selected.payment_status)}`}>
                                            Payment {labelStatus(selected.payment_status)}
                                        </span>
                                        {selected.mpesa_receipt && (
                                            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 px-2.5 py-1">
                                                Receipt {selected.mpesa_receipt}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Line items</h3>
                                        <ul className="divide-y divide-gray-100 dark:divide-slate-800 rounded-xl border border-gray-100 dark:border-slate-800">
                                            {lineItems(selected).map((item, index) => (
                                                <li key={`${item.name}-${index}`} className="flex justify-between gap-3 px-3 py-2 text-sm">
                                                    <span className="text-gray-800 dark:text-slate-200">
                                                        {item.name || 'Item'} × {item.qty ?? item.quantity ?? 1}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-slate-400">
                                                        {item.price ?? item.unit_price ?? ''}
                                                    </span>
                                                </li>
                                            ))}
                                            {lineItems(selected).length === 0 && (
                                                <li className="px-3 py-2 text-sm text-gray-500">No line items</li>
                                            )}
                                        </ul>
                                    </div>

                                    {(selected.delivery_method || selected.delivery_address || selected.notes) && (
                                        <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
                                            {selected.delivery_method && (
                                                <p>Delivery: {labelStatus(selected.delivery_method)}</p>
                                            )}
                                            {selected.delivery_address && <p>{selected.delivery_address}</p>}
                                            {selected.notes && <p>Notes: {selected.notes}</p>}
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Status actions
                                        </h3>
                                        {allowedStatuses(selected).length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                No further status changes are allowed.
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {allowedStatuses(selected).map((next) => (
                                                    <button
                                                        key={next}
                                                        type="button"
                                                        disabled={updating}
                                                        onClick={() => void changeStatus(next)}
                                                        className={`rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
                                                            next === 'cancelled' || next === 'refunded'
                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                                                : 'bg-secondary-800 text-white hover:bg-secondary-700'
                                                        }`}
                                                    >
                                                        Mark {labelStatus(next)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                        {reservations.length === 0 ? (
                            <div className="p-8 text-sm text-gray-500 dark:text-slate-400">
                                No reservations yet.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                                {reservations.map((reservation) => {
                                    const href = waMeLink(reservation.customer_phone, reservation.whatsapp_url);
                                    return (
                                        <li
                                            key={reservationId(reservation)}
                                            className="px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {reservation.customer_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    {reservation.reservation_date} at {reservation.reservation_time}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                                    {reservationId(reservation)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-slate-300">
                                                    <Users className="w-4 h-4" />
                                                    {reservation.party_size}
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusTone(reservation.status)}`}>
                                                    {labelStatus(reservation.status)}
                                                </span>
                                                {href && (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommerceOrders;
