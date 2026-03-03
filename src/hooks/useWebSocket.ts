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

export const useWebSocket = (pageId: string, senderId: string | undefined, onMessage: MessageHandler) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 segundos

  // Actualizar la referencia de onMessage sin causar reconexión
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // No conectar si no hay pageId o senderId
    if (!pageId || !senderId) {
      logger.warn(`Cannot connect: pageId=${pageId}, senderId=${senderId}`);
      return;
    }

    // No reconectar si ya hay una conexión activa
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      logger.info(`WebSocket already connected, skipping reconnect`);
      return;
    }

    try {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
      const url = `${wsUrl}?pageId=${encodeURIComponent(pageId)}&senderId=${encodeURIComponent(senderId)}`;

      logger.info(`Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        logger.info('✅ WebSocket connected successfully');
        console.log('✅ WebSocket connected successfully');
        console.log('Connected to:', wsUrl);
        console.log('PageId:', pageId);
        console.log('SenderId:', senderId);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.info(`📨 WebSocket message received:`, message);
          console.log('📨 WebSocket RAW message received:', event.data);
          console.log('📨 WebSocket PARSED message:', message);
          onMessageRef.current(message);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
          console.error('❌ Error parsing WebSocket message:', error);
          console.error('Raw data:', event.data);
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
        console.error('❌ WebSocket error:', error);
      };

      ws.onclose = (event) => {
        logger.warn(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
        console.warn(`⚠️ WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
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
  }, [pageId, senderId]);

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
    if (pageId && senderId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [pageId, senderId, connect, disconnect]);

  return { send, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
};
