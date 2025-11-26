import { io, Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private queryClient: QueryClient | null = null;

  connect(token: string, queryClient?: QueryClient) {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Store queryClient for invalidation
    if (queryClient) {
      this.queryClient = queryClient;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    // Listen to real-time events and invalidate React Query cache
    this.socket.on('conversation:new', (data) => {
      console.log('[Socket] New conversation:', data);
      // Refresh conversations list
      this.queryClient?.invalidateQueries({ queryKey: ['conversations', 'open'] });
    });

    this.socket.on('conversation:updated', (data) => {
      console.log('[Socket] Conversation updated:', data);
      // Refresh conversations list and specific conversation
      this.queryClient?.invalidateQueries({ queryKey: ['conversations'] });
      if (data?.conversationId) {
        this.queryClient?.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
      }
    });

    this.socket.on('message:new', (data) => {
      console.log('[Socket] New message:', data);
      
      if (data?.conversationId) {
        const { conversationId, direction, message } = data;
        const msgDirection = direction || message?.direction;
        
        console.log('[Socket] Message direction:', msgDirection, 'for conversation:', conversationId);
        
        // Invalidate messages query - this will trigger useEffect in ConversationView
        // to recompute unread count from the fresh messages array
        this.queryClient?.invalidateQueries({ queryKey: ['messages', conversationId] });
        
        // Also invalidate conversations to get updated data from backend
        this.queryClient?.invalidateQueries({ queryKey: ['conversations'] });
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketClient = new SocketClient();

