import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketEvent = {
    type: string;
    data: any;
};

// Use the appropriate backend URL based on environment
const WS_BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('http', 'ws')
    : 'ws://localhost:8000';

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        // Connect to the new FastAPI WS router
        const wsUrl = `${WS_BASE_URL}/ws/realtime?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Real-time WebSocket connected');
            setIsConnected(true);

            // Start ping heartbeat to keep connection alive through load balancers
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000);

            ws.addEventListener('close', () => clearInterval(pingInterval));
        };

        ws.onmessage = (event) => {
            // Ignore ping/pong text
            if (event.data === 'pong') return;

            try {
                const parsed = JSON.parse(event.data);
                setLastEvent(parsed);
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('Real-time WebSocket disconnected. Attempting to reconnect in 5s...');

            // Try to reconnect with exponential backoff or simple delay
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 5000);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            ws.close();
        };

        wsRef.current = ws;
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { isConnected, lastEvent };
}
