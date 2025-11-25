export interface Conversation {
  id: string;
  customerId: string;
  customerPhone?: string;
  userPhone?: string;
  displayName?: string;
  userName?: string;
  status: 'open' | 'closed';
  context?: ConversationContext;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: string;
}

export interface Vehicle {
  plate?: string;
  make?: string;
  model?: string;
  year?: number | string;
  color?: string;
}

export interface ConversationContext {
  plate?: string;
  vehicle?: Vehicle | string;
  partDescription?: string;
}

export interface ConversationsResponse {
  success: boolean;
  items: Conversation[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ConversationDetailResponse {
  success: boolean;
  conversation: Conversation;
}

