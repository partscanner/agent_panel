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

  // Format vehicle info for display
  const formatVehicle = (vehicle: any): string => {
    if (!vehicle) return '';
    if (typeof vehicle === 'string') return vehicle;
    
    const parts: string[] = [];
    if (vehicle.make) parts.push(vehicle.make);
    if (vehicle.model) parts.push(vehicle.model);
    if (vehicle.year) parts.push(String(vehicle.year));
    
    return parts.join(' · ') || '';
  };

  const vehicleLabel = conversation.context?.vehicle 
    ? formatVehicle(conversation.context.vehicle) 
    : '';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 shadow-sm" style={{ borderBottomColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Customer Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}>
                {(conversation.customerPhone || conversation.customerId).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold truncate" style={{ color: '#111827' }}>
                  {conversation.customerPhone || conversation.customerId}
                </h2>
                {isClosed && (
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#9CA3AF' }}></span>
                    {t('conversation.closed')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Context Info */}
            {conversation.context && (
              <div className="flex flex-wrap gap-2">
                {conversation.context.plate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg" style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {conversation.context.plate}
                  </span>
                )}
                {vehicleLabel && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg" style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    {vehicleLabel}
                  </span>
                )}
                {conversation.context.partDescription && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg" style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}>
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
              className="ml-4 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}
              onMouseEnter={(e) => {
                if (!closeConversation.isPending) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D1D5DB';
                }
              }}
              onMouseLeave={(e) => {
                if (!closeConversation.isPending) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5E7EB';
                }
              }}
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
        <div className="border-t px-6 py-4 text-center" style={{ borderTopColor: '#E5E7EB', backgroundColor: '#F5F5F7' }}>
          <p className="text-sm" style={{ color: '#6B7280' }}>{t('conversation.closed')}</p>
        </div>
      )}
    </div>
  );
};

