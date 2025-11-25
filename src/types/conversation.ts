export interface Conversation {
  id: string;
  customerId: string;
  customerPhone?: string;
  status: 'open' | 'closed';
  context?: ConversationContext;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: string;
}

export interface ConversationContext {
  plate?: string;
  vehicle?: string;
  partDescription?: string;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ConversationDetailResponse {
  success: boolean;
  conversation: Conversation;
}

