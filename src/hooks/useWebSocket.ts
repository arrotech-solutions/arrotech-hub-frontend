import { useCallback, useEffect, useState } from 'react';

export type WebSocketEvent = {
    type: string;
    data: any;
};

type EventListener = (event: WebSocketEvent) => void;
type ConnectionListener = (connected: boolean) => void;

function resolveWsBaseUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return apiUrl.replace(/^https?/, (match) => (match === 'https' ? 'wss' : 'ws'));
}

// Shared singleton — one socket for the whole app (avoids duplicate connections per hook instance)
let sharedSocket: WebSocket | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let shutdownTimer: ReturnType<typeof setTimeout> | null = null;
let subscriberCount = 0;
let reconnectAttempt = 0;
let shouldStayConnected = false;

const eventListeners = new Set<EventListener>();
const connectionListeners = new Set<ConnectionListener>();

function notifyConnection(connected: boolean) {
    connectionListeners.forEach((listener) => listener(connected));
}

function notifyEvent(event: WebSocketEvent) {
    eventListeners.forEach((listener) => listener(event));
}

function clearPingInterval() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

function scheduleReconnect() {
    if (!shouldStayConnected || reconnectTimeout) return;
    const delay = Math.min(30000, 1000 * 2 ** reconnectAttempt);
    reconnectAttempt += 1;
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        openSharedConnection();
    }, delay);
}

function openSharedConnection() {
    if (!shouldStayConnected) return;

    if (
        sharedSocket &&
        (sharedSocket.readyState === WebSocket.OPEN ||
            sharedSocket.readyState === WebSocket.CONNECTING)
    ) {
        return;
    }

    // Auth is handled by the HttpOnly cookie sent automatically on the WS upgrade request
    const wsUrl = `${resolveWsBaseUrl()}/ws/realtime`;
    const ws = new WebSocket(wsUrl);
    sharedSocket = ws;

    ws.onopen = () => {
        reconnectAttempt = 0;
        notifyConnection(true);
        clearPingInterval();
        pingInterval = setInterval(() => {
            if (sharedSocket?.readyState === WebSocket.OPEN) {
                sharedSocket.send('ping');
            }
        }, 30000);
    };

    ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
            notifyEvent(JSON.parse(event.data));
        } catch {
            /* ignore non-JSON */
        }
    };

    ws.onclose = () => {
        clearPingInterval();
        if (sharedSocket === ws) {
            sharedSocket = null;
        }
        notifyConnection(false);
        if (shouldStayConnected) {
            scheduleReconnect();
        }
    };

    ws.onerror = () => {
        // onclose will handle reconnect; avoid calling close() here (causes noisy logs)
    };
}

function closeSharedConnection() {
    shouldStayConnected = false;
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    clearPingInterval();
    const ws = sharedSocket;
    sharedSocket = null;
    if (!ws) return;

    if (ws.readyState === WebSocket.CONNECTING) {
        // Let the handshake finish, then close cleanly (reduces "closed before established" noise in dev)
        ws.addEventListener('open', () => ws.close(), { once: true });
        return;
    }
    if (ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
}

function subscribe(listener: EventListener, onConnection: ConnectionListener): () => void {
    if (shutdownTimer) {
        clearTimeout(shutdownTimer);
        shutdownTimer = null;
    }

    subscriberCount += 1;
    shouldStayConnected = true;
    eventListeners.add(listener);
    connectionListeners.add(onConnection);

    if (sharedSocket?.readyState === WebSocket.OPEN) {
        onConnection(true);
    }

    openSharedConnection();

    return () => {
        eventListeners.delete(listener);
        connectionListeners.delete(onConnection);
        subscriberCount = Math.max(0, subscriberCount - 1);

        if (subscriberCount === 0) {
            // Brief delay survives React Strict Mode double-mount in development
            shutdownTimer = setTimeout(() => {
                shutdownTimer = null;
                if (subscriberCount === 0) {
                    closeSharedConnection();
                }
            }, 150);
        }
    };
}

export function sendWebSocketMessage(payload: unknown) {
    if (sharedSocket?.readyState === WebSocket.OPEN) {
        sharedSocket.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
}

/** Force-close the shared realtime socket (logout / account deletion). */
export function disconnectRealtime() {
    closeSharedConnection();
}

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(
        () => sharedSocket?.readyState === WebSocket.OPEN
    );
    const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

    useEffect(() => {
        return subscribe(setLastEvent, setIsConnected);
    }, []);

    const sendPresence = useCallback((contactId: string | null) => {
        sendWebSocketMessage({
            type: 'whatsapp_presence',
            contact_id: contactId,
        });
    }, []);

    return { isConnected, lastEvent, sendPresence };
}
