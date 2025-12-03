import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useConversation, useMessages, useSendMessage, useCloseConversation } from '../../hooks/useConversations';
import { MessageList } from '../messages/MessageList';
import { MessageInput } from '../messages/MessageInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { computeUnreadCount } from '../../utils/unreadCounter';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import { ConversationActionsMenu } from './ConversationActionsMenu';

interface ConversationViewProps {
  conversationId: string;
}

export const ConversationView = ({ conversationId }: ConversationViewProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: conversationData, isLoading: isLoadingConversation } = useConversation(conversationId);
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const closeConversation = useCloseConversation();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const conversation = conversationData?.conversation;
  const messages = messagesData?.messages || [];

  // Compute and sync unread count from messages when conversation is opened
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const unreadCount = computeUnreadCount(messages);

      console.log('[Unread] Computing unread count for conversation', conversationId, {
        totalMessages: messages.length,
        lastMessageDirection: lastMessage.direction,
        computedUnreadCount: unreadCount,
      });

      // Update conversation list with computed unread count and last message direction
      ['open', 'closed'].forEach((status) => {
        queryClient.setQueryData(['conversations', status], (oldData: any) => {
          if (!oldData?.items) return oldData;

          return {
            ...oldData,
            items: oldData.items.map((conv: any) =>
              conv.id === conversationId
                ? {
                  ...conv,
                  lastMessageDirection: lastMessage.direction,
                  unreadCount: unreadCount,
                }
                : conv
            ),
          };
        });
      });
    }
  }, [conversationId, messages, queryClient]);

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

  const handleCopyVehicleSummary = async () => {
    const vehicle = conversation?.context?.vehicle;
    const partDescription = conversation?.context?.partDescription;

    if (!vehicle || typeof vehicle === 'string') {
      console.log('Vehicle data not available for copying');
      return;
    }

    // Build summary string: <MODEL> <YEAR> <ENGINE_CODE> <PART_DESCRIPTION>
    const parts: string[] = [];

    // Add model (which might include make)
    if (vehicle.make && vehicle.model) {
      parts.push(`${vehicle.make} ${vehicle.model}`);
    } else if (vehicle.model) {
      parts.push(vehicle.model);
    } else if (vehicle.make) {
      parts.push(vehicle.make);
    }

    // Add year
    if (vehicle.year) {
      parts.push(String(vehicle.year));
    }

    // Add engine code (check multiple possible fields)
    const engineCode = vehicle.engineCode || vehicle.engine_code || vehicle.engine || vehicle.engine_number;
    if (engineCode) {
      parts.push(engineCode);
    }

    // Add part description
    if (partDescription) {
      parts.push(partDescription);
    }

    const summaryText = parts.join(' ').trim();

    if (!summaryText) {
      console.log('No vehicle information to copy');
      return;
    }

    // Copy to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summaryText);
        console.log('Copied:', summaryText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // Fallback for environments without clipboard API
        console.log('Clipboard not available. Text to copy:', summaryText);
        alert(`Copy this text: ${summaryText}`);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(`Failed to copy. Text: ${summaryText}`);
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
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {conversation.context.plate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full" style={{ color: '#374151', backgroundColor: '#F3F4F6' }}>
                    {conversation.context.plate}
                  </span>
                )}
                {vehicleLabel && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full" style={{ color: '#374151', backgroundColor: '#F3F4F6' }}>
                    {/* Copy icon inside vehicle chip */}
                    {(conversation.context.vehicle || conversation.context.partDescription) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyVehicleSummary();
                        }}
                        className="ml-1 hover:opacity-70 transition-opacity focus:outline-none"
                        aria-label="Copy vehicle info"
                        title={copySuccess ? 'Copied!' : 'Copy vehicle info'}
                        style={{ color: copySuccess ? '#10B981' : '#6B7280' }}
                      >
                        {copySuccess ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                    {vehicleLabel}
                  </span>
                )}
                {conversation.context.partDescription && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full" style={{ color: '#374151', backgroundColor: '#F3F4F6' }}>
                    🔧 {conversation.context.partDescription}
                  </span>
                )}
              </div>
            )}

            {/* Assigned Agent Info */}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                {conversation.assignedAgent 
                  ? `${t('conversation.assignedTo')}: ${conversation.assignedAgent.name}`
                  : t('conversation.unassigned')
                }
              </span>
            </div>

            {/* Workflow Status Badge - Read Only */}
            {conversation.workflowStatus && (
              <div className="mt-2">
                <WorkflowStatusBadge workflowStatus={conversation.workflowStatus} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {/* Conversation Actions Menu (Assignment + Workflow Status) */}
            {!isClosed && (
              <ConversationActionsMenu
                conversation={conversation}
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                align="right"
                trigger={
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label="Conversation actions"
                  >
                    <svg className="w-5 h-5" style={{ color: '#6B7280' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                }
              />
            )}

            {/* Close Button */}
            {!isClosed && (
              <button
                onClick={handleCloseConversation}
                disabled={closeConversation.isPending}
                className="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

