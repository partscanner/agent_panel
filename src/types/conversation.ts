export type WorkflowStatus = 'new' | 'in_progress' | 'no_answer' | 'won' | 'lost';

export interface Conversation {
  id: string;
  customerId: string;
  customerPhone?: string;
  userPhone?: string;
  displayName?: string;
  userName?: string;
  status: 'open' | 'closed';
  workflowStatus?: WorkflowStatus;
  context?: ConversationContext;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageDirection?: 'inbound' | 'outbound';
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    role: 'agent' | 'admin';
  } | null;
}

export interface Vehicle {
  plate?: string;
  make?: string;
  model?: string;
  year?: number | string;
  color?: string;
  engineCode?: string;
  engine?: string;
  engine_code?: string;
  engine_number?: string;
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

