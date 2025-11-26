import { useTranslation } from 'react-i18next';
import { useConversations } from '../../hooks/useConversations';
import { ConversationListItem } from './ConversationListItem';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ConversationListProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export const ConversationList = ({
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useConversations('open');

  // Debug logging
  console.log('[ConversationList] Full data:', data);
  console.log('[ConversationList] Items:', data?.items);
  console.log('[ConversationList] Items length:', data?.items?.length);

  if (isLoading) {
    return (
      <div className="h-full bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-600">{t('common.error')}</p>
        </div>
      </div>
    );
  }

  const conversations = data?.items || [];

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center px-4">
          <div className="text-neutral-300 mb-3">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-500 font-medium">{t('conversations.noConversations')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-neutral-200 shadow-sm">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between" style={{ color: '#111827' }}>
        <h2 className="text-lg font-semibold" style={{ color: '#111827' }}>{t('conversations.title')}</h2>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}</p>
      </div>
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isActive={activeConversationId === conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
          />
        ))}
      </div>
    </div>
  );
};

