import { apiClient } from './client';
import type {
  Conversation,
  ConversationsResponse,
  ConversationDetailResponse,
  WorkflowStatus,
} from '../types/conversation';
import type {
  Message,
  MessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/message';
import type { Agent, AgentsResponse } from '../types/agent';

// Transform backend conversation to frontend format
const transformConversation = (backendConv: any): Conversation => {
  // Extract phone from various possible locations
  const phone = backendConv.userPhone 
    || backendConv.user_phone 
    || backendConv.userId?.phone 
    || backendConv.customerPhone 
    || backendConv.customer_phone;

  // Extract display name if available
  const displayName = backendConv.displayName 
    || backendConv.display_name 
    || backendConv.userName 
    || backendConv.user_name 
    || backendConv.userId?.name;

  // Extract assigned agent
  const assignedAgent = backendConv.assignedAgent || backendConv.assigned_agent;
  const transformedAssignedAgent = assignedAgent ? {
    id: assignedAgent._id || assignedAgent.id,
    name: assignedAgent.name,
    email: assignedAgent.email,
    role: assignedAgent.role,
  } : null;

  return {
    id: backendConv._id || backendConv.id,
    customerId: backendConv.customerId || backendConv.customer_id || backendConv.userId?._id || '',
    customerPhone: phone,
    userPhone: phone,
    displayName,
    userName: displayName,
    status: backendConv.status,
    workflowStatus: backendConv.workflowStatus || backendConv.workflow_status,
    context: {
      plate: backendConv.plate || backendConv.context?.plate,
      vehicle: backendConv.vehicle || backendConv.context?.vehicle,
      partDescription: backendConv.partDescription || backendConv.part_description || backendConv.context?.partDescription,
    },
    lastMessageAt: backendConv.lastMessageAt || backendConv.last_message_at || backendConv.updatedAt,
    createdAt: backendConv.createdAt || backendConv.created_at,
    updatedAt: backendConv.updatedAt || backendConv.updated_at,
    unreadCount: backendConv.unreadCount || backendConv.unread_count || 0,
    lastMessage: backendConv.lastMessage || backendConv.lastMessageText || backendConv.last_message_text || backendConv.lastMessagePreview,
    lastMessageDirection: backendConv.lastMessageDirection || backendConv.last_message_direction,
    assignedAgent: transformedAssignedAgent,
  };
};

// Transform backend message to frontend format
const transformMessage = (backendMsg: any): Message => {
  return {
    id: backendMsg._id || backendMsg.id,
    conversationId: backendMsg.conversationId || backendMsg.conversation_id,
    direction: backendMsg.direction,
    text: backendMsg.text || backendMsg.content || '',
    timestamp: backendMsg.timestamp || backendMsg.createdAt || backendMsg.created_at,
    status: backendMsg.status,
    metadata: backendMsg.metadata,
  };
};

export const agentApi = {
  getConversations: async (params: {
    status?: 'open' | 'closed';
    workflowStatus?: WorkflowStatus;
    page?: number;
    pageSize?: number;
    mine?: boolean;
    agentId?: string;
  }): Promise<ConversationsResponse> => {
    // Transform mine boolean to string for backend
    const backendParams: any = { ...params };
    if (params.mine !== undefined) {
      backendParams.mine = params.mine ? 'true' : 'false';
    }
    
    const response = await apiClient.get<any>('/agent/conversations', {
      params: backendParams,
    });
    
    // Transform backend response to frontend format
    const backendData = response.data;
    return {
      success: backendData.success,
      items: (backendData.items || []).map(transformConversation),
      page: backendData.page,
      pageSize: backendData.pageSize,
      total: backendData.total,
    };
  },

  getConversation: async (id: string): Promise<ConversationDetailResponse> => {
    const response = await apiClient.get<any>(
      `/agent/conversations/${id}`
    );
    
    const backendData = response.data;
    return {
      success: backendData.success,
      conversation: transformConversation(backendData.conversation),
    };
  },

  getMessages: async (
    conversationId: string,
    params?: { before?: string; limit?: number }
  ): Promise<MessagesResponse> => {
    const response = await apiClient.get<any>(
      `/agent/conversations/${conversationId}/messages`,
      { params }
    );
    
    const backendData = response.data;
    return {
      success: backendData.success,
      messages: (backendData.messages || []).map(transformMessage),
      pagination: backendData.pagination,
    };
  },

  sendMessage: async (
    conversationId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    const response = await apiClient.post<any>(
      `/agent/conversations/${conversationId}/reply`,
      data
    );
    
    const backendData = response.data;
    return {
      success: backendData.success,
      message: transformMessage(backendData.message),
    };
  },

  closeConversation: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<{ success: boolean }>(
      `/agent/conversations/${conversationId}/close`
    );
    return response.data;
  },

  getAgents: async (): Promise<Agent[]> => {
    const response = await apiClient.get<AgentsResponse>('/agent/agents');
    return response.data.items || [];
  },

  assignConversation: async (
    conversationId: string,
    agentId: string | null
  ): Promise<Conversation> => {
    const response = await apiClient.patch<any>(
      `/agent/conversations/${conversationId}/assign`,
      { agentId }
    );
    return transformConversation(response.data.conversation);
  },

  updateWorkflowStatus: async (
    conversationId: string,
    workflowStatus: 'in_progress' | 'won' | 'lost'
  ): Promise<Conversation> => {
    const response = await apiClient.patch<any>(
      `/agent/conversations/${conversationId}/workflow-status`,
      { workflowStatus }
    );
    return transformConversation(response.data.conversation);
  },
};

