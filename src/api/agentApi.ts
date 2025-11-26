import { apiClient } from './client';
import type {
  Conversation,
  ConversationsResponse,
  ConversationDetailResponse,
} from '../types/conversation';
import type {
  Message,
  MessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/message';

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

  return {
    id: backendConv._id || backendConv.id,
    customerId: backendConv.customerId || backendConv.customer_id || backendConv.userId?._id || '',
    customerPhone: phone,
    userPhone: phone,
    displayName,
    userName: displayName,
    status: backendConv.status,
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
    page?: number;
    pageSize?: number;
  }): Promise<ConversationsResponse> => {
    const response = await apiClient.get<any>('/agent/conversations', {
      params,
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
};

