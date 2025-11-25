import { apiClient } from './client';
import type {
  ConversationsResponse,
  ConversationDetailResponse,
} from '../types/conversation';
import type {
  MessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/message';

export const agentApi = {
  getConversations: async (params: {
    status?: 'open' | 'closed';
    page?: number;
    pageSize?: number;
  }): Promise<ConversationsResponse> => {
    const response = await apiClient.get<ConversationsResponse>('/agent/conversations', {
      params,
    });
    return response.data;
  },

  getConversation: async (id: string): Promise<ConversationDetailResponse> => {
    const response = await apiClient.get<ConversationDetailResponse>(
      `/agent/conversations/${id}`
    );
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    params?: { before?: string; limit?: number }
  ): Promise<MessagesResponse> => {
    const response = await apiClient.get<MessagesResponse>(
      `/agent/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    const response = await apiClient.post<SendMessageResponse>(
      `/agent/conversations/${conversationId}/reply`,
      data
    );
    return response.data;
  },

  closeConversation: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<{ success: boolean }>(
      `/agent/conversations/${conversationId}/close`
    );
    return response.data;
  },
};

