import { useTranslation } from 'react-i18next';
import { useConversation, useMessages, useSendMessage, useCloseConversation } from '../../hooks/useConversations';
import { MessageList } from '../messages/MessageList';
import { MessageInput } from '../messages/MessageInput';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ConversationViewProps {
  conversationId: string;
}

export const ConversationView = ({ conversationId }: ConversationViewProps) => {
  const { t } = useTranslation();
  const { data: conversationData, isLoading: isLoadingConversation } = useConversation(conversationId);
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const closeConversation = useCloseConversation();

  const conversation = conversationData?.conversation;
  const messages = messagesData?.messages || [];

  // Debug logging
  console.log('[ConversationView] ConversationId:', conversationId);
  console.log('[ConversationView] Conversation data:', conversationData);
  console.log('[ConversationView] Messages data:', messagesData);
  console.log('[ConversationView] Messages array:', messages);
  console.log('[ConversationView] Messages length:', messages.length);

  const handleSendMessage = async (text: string) => {
    try {
      await sendMessage.mutateAsync({ conversationId, text });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCloseConversation = async () => {
    if (window.confirm(t('conversation.close') + '?')) {
      try {
        await closeConversation.mutateAsync(conversationId);
      } catch (error) {
        console.error('Failed to close conversation:', error);
      }
    }
  };

  if (isLoadingConversation || isLoadingMessages) {
    return (
      <div className="h-full bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p className="text-sm text-neutral-500">{t('common.error')}</p>
      </div>
    );
  }

  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white px-6 py-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Customer Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-white font-semibold text-sm">
                {(conversation.customerPhone || conversation.customerId).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-neutral-900 truncate">
                  {conversation.customerPhone || conversation.customerId}
                </h2>
                {isClosed && (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                    {t('conversation.closed')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Context Info */}
            {conversation.context && (
              <div className="flex flex-wrap gap-2">
                {conversation.context.plate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-brand-secondary bg-neutral-100 rounded-lg">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {conversation.context.plate}
                  </span>
                )}
                {conversation.context.vehicle && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 rounded-lg">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    {conversation.context.vehicle}
                  </span>
                )}
                {conversation.context.partDescription && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 rounded-lg">
                    🔧 {conversation.context.partDescription}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Close Button */}
          {!isClosed && (
            <button
              onClick={handleCloseConversation}
              disabled={closeConversation.isPending}
              className="ml-4 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('conversation.close')}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      {!isClosed ? (
        <MessageInput
          onSend={handleSendMessage}
          disabled={sendMessage.isPending}
        />
      ) : (
        <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4 text-center">
          <p className="text-sm text-neutral-500">{t('conversation.closed')}</p>
        </div>
      )}
    </div>
  );
};

