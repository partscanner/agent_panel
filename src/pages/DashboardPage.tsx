import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ConversationList } from '../components/conversations/ConversationList';
import { ConversationView } from '../components/conversations/ConversationView';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Left sidebar - Conversations list */}
        <div className="w-full md:w-96 border-r border-gray-200 flex-shrink-0">
          <ConversationList
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
          />
        </div>

        {/* Right panel - Conversation view */}
        <div className="flex-1 hidden md:block">
          {activeConversationId ? (
            <ConversationView conversationId={activeConversationId} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <p className="text-gray-500">{t('dashboard.selectConversation')}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

