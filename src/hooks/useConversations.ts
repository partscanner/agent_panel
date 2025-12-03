import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '../api/agentApi';

export interface ConversationsFilter {
  status?: 'open' | 'closed';
  mine?: boolean;
  agentId?: string;
}

export const useConversations = (filter: ConversationsFilter = {}) => {
  const { status = 'open', mine = false, agentId } = filter;
  
  return useQuery({
    queryKey: ['conversations', status, mine, agentId ?? null],
    queryFn: () => agentApi.getConversations({ 
      status, 
      page: 1, 
      pageSize: 50,
      mine,
      agentId,
    }),
  });
};

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => agentApi.getConversation(id),
    enabled: !!id,
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => agentApi.getMessages(conversationId, { limit: 100 }),
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      agentApi.sendMessage(conversationId, { text }),
    onSuccess: (_, variables) => {
      console.log('[Unread] Agent sent reply, resetting unread count to 0 for conversation:', variables.conversationId);
      
      // Optimistically set unread count to 0 (agent just replied)
      ['open', 'closed'].forEach((status) => {
        queryClient.setQueryData(['conversations', status], (oldData: any) => {
          if (!oldData?.items) return oldData;
          
          return {
            ...oldData,
            items: oldData.items.map((conv: any) => {
              if (conv.id !== variables.conversationId) return conv;
              
              console.log('[Unread] Resetting unread count', {
                conversationId: variables.conversationId,
                previousUnread: conv.unreadCount ?? 0,
                nextUnread: 0,
              });
              
              return { 
                ...conv, 
                unreadCount: 0, 
                lastMessageDirection: 'outbound' 
              };
            }),
          };
        });
      });
      
      // Invalidate messages and conversations to get fresh data
      // The useEffect in ConversationView will recompute unread count from messages
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useCloseConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => agentApi.closeConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: agentApi.getAgents,
    staleTime: 60_000, // Cache for 1 minute
  });
};

export const useAssignConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, agentId }: { conversationId: string; agentId: string | null }) =>
      agentApi.assignConversation(conversationId, agentId),
    onSuccess: (updatedConversation, variables) => {
      // Update the specific conversation detail cache
      queryClient.setQueryData(
        ['conversation', variables.conversationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            conversation: updatedConversation,
          };
        }
      );

      // Update conversation in all conversation lists
      queryClient.setQueryData(['conversations', 'open', false, null], (oldData: any) => {
        if (!oldData?.items) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((conv: any) =>
            conv.id === variables.conversationId ? updatedConversation : conv
          ),
        };
      });

      // Invalidate all conversation queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
  });
};

