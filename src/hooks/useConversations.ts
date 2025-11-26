import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '../api/agentApi';

export const useConversations = (status: 'open' | 'closed' = 'open') => {
  return useQuery({
    queryKey: ['conversations', status],
    queryFn: () => agentApi.getConversations({ status, page: 1, pageSize: 50 }),
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

