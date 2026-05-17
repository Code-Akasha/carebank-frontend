import { useEffect, useRef, useCallback } from "react";

interface SSEOptions {
    onEvent: (event: { type: string; [key: string]: unknown }) => void;
    onError?: (error: Event) => void;
    enabled?: boolean;
}

/**
 * Hook to connect to the CareBank SSE event stream.
 * Automatically reconnects on failure with exponential backoff.
 */
export function useEventStream({ onEvent, onError, enabled = true }: SSEOptions) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const retryCountRef = useRef(0);
    const maxRetries = 5;

    const connectRef = useRef<() => void>(() => {});

    const connect = useCallback(() => {
        if (!enabled) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const url = `${baseUrl}/api/events/stream?token=${encodeURIComponent(token)}`;

        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                retryCountRef.current = 0;
                onEvent(data);
            } catch {
                // Ignore parse errors (keepalive comments)
            }
        };

        es.onerror = (err) => {
            es.close();
            eventSourceRef.current = null;
            onError?.(err);

            if (retryCountRef.current < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                retryCountRef.current += 1;
                setTimeout(() => connectRef.current(), delay);
            }
        };
    }, [enabled, onEvent, onError]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        connect();
        return () => {
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
        };
    }, [connect]);
}
