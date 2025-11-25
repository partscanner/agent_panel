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
      <div className="flex h-full gap-0">
        {/* Left sidebar - Conversations list */}
        <div className="w-full md:w-96 flex-shrink-0">
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
            <div className="flex flex-col items-center justify-center h-full bg-white">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 mb-4" style={{ color: '#D1D5DB' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-base font-medium" style={{ color: '#6B7280' }}>{t('dashboard.selectConversation')}</p>
                <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

