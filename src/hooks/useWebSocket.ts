import { useEffect, useRef, useCallback } from 'react';
import { Logger } from '../utils/logger';

const logger = new Logger('useWebSocket');

interface WebSocketMessage {
  type: 'message' | 'conversation_update' | 'typing' | 'read' | 'error';
  pageId: string;
  senderId?: string;
  data: any;
  timestamp: number;
}

type MessageHandler = (message: WebSocketMessage) => void;

export const useWebSocket = (pageId: string, onMessage: MessageHandler) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 segundos

  const connect = useCallback(() => {
    // No conectar si no hay pageId
    if (!pageId) {
      logger.warn('Cannot connect: pageId is not set');
      return;
    }

    try {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
      const url = `${wsUrl}?pageId=${encodeURIComponent(pageId)}`;

      logger.info(`Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        logger.info('✅ WebSocket connected successfully');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.info(`📨 WebSocket message received:`, message);
          onMessage(message);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        logger.warn(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
        wsRef.current = null;

        // Intentar reconectar
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          logger.info(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          logger.error('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      logger.error('Error connecting to WebSocket:', error);
    }
  }, [pageId, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      logger.info('Message sent via WebSocket');
    } else {
      logger.warn(`WebSocket is not connected (state: ${wsRef.current?.readyState})`);
    }
  }, []);

  useEffect(() => {
    if (pageId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [pageId, connect, disconnect]);

  return { send, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
};
