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
    return <LoadingSpinner />;
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">{t('common.error')}</p>
      </div>
    );
  }

  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {conversation.customerPhone || conversation.customerId}
            </h2>
            {conversation.context && (
              <div className="mt-1 text-sm text-gray-600">
                {conversation.context.plate && (
                  <span className="mr-3">
                    {t('conversation.context.plate')}: {conversation.context.plate}
                  </span>
                )}
                {conversation.context.vehicle && (
                  <span className="mr-3">
                    {t('conversation.context.vehicle')}: {conversation.context.vehicle}
                  </span>
                )}
                {conversation.context.partDescription && (
                  <span>
                    {t('conversation.context.part')}: {conversation.context.partDescription}
                  </span>
                )}
              </div>
            )}
          </div>
          {!isClosed && (
            <button
              onClick={handleCloseConversation}
              disabled={closeConversation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('conversation.close')}
            </button>
          )}
          {isClosed && (
            <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md">
              {t('conversation.closed')}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      {!isClosed && (
        <MessageInput
          onSend={handleSendMessage}
          disabled={sendMessage.isPending}
        />
      )}
    </div>
  );
};

