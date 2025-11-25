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

  if (isLoading) {
    return (
      <div className="h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-600">{t('common.error')}</p>
      </div>
    );
  }

  const conversations = data?.conversations || [];

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">{t('conversations.noConversations')}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-800">{t('conversations.title')}</h2>
      </div>
      <div>
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

