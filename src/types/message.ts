export interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination?: {
    hasMore: boolean;
    before?: string;
  };
}

export interface SendMessageRequest {
  text: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: Message;
}

