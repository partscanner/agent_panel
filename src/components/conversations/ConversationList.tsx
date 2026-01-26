import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversations } from '../../hooks/useConversations';
import { ConversationListItem } from './ConversationListItem';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { WorkflowStatus } from '../../types/conversation';

interface ConversationListProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

type FilterOption = 'open' | 'new' | 'in_progress' | 'no_answer' | 'won' | 'lost' | 'closed';

export const ConversationList = ({
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) => {
  const { t } = useTranslation();
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('open');

  // Map filter to API params
  const getFilterParams = (filter: FilterOption): { status?: 'open' | 'closed'; workflowStatus?: WorkflowStatus } => {
    switch (filter) {
      case 'open':
        return { status: 'open' };
      case 'closed':
        return { status: 'closed' };
      case 'new':
        return { status: 'open', workflowStatus: 'new' };
      case 'in_progress':
        return { status: 'open', workflowStatus: 'in_progress' };
      case 'no_answer':
        return { status: 'open', workflowStatus: 'no_answer' };
      case 'won':
        return { workflowStatus: 'won' };
      case 'lost':
        return { workflowStatus: 'lost' };
      default:
        return { status: 'open' };
    }
  };

  const filterParams = getFilterParams(activeFilter);
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useConversations({
    ...filterParams,
    mine: showMineOnly
  });

  // Flatten all pages into a single array
  const conversations = data?.pages.flatMap(page => page.items) || [];

  // Get total count from the first page (backend returns total in every page)
  const totalConversations = data?.pages[0]?.total || 0;

  const isFiltered = showMineOnly;

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        console.log('[ConversationList] Loading more conversations...');
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Setup intersection observer
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px', // Start loading 100px before reaching the bottom
      threshold: 0.1,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="h-full flex flex-col bg-white border-r border-neutral-200 shadow-sm">
      {/* Header - Always visible */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-5 py-4" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: '#111827' }}>{t('conversations.title')}</h2>
          {!isLoading && !error && (
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
              {conversations.length === totalConversations ? (
                // Todas cargadas
                <>{totalConversations} {totalConversations === 1 ? 'conversation' : 'conversations'}</>
              ) : (
                // Mostrando X de Y
                <>{conversations.length} de {totalConversations}</>
              )}
            </p>
          )}
        </div>

        {/* Status Filter Select */}
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
            {t('conversationFilters.statusLabel')}
          </label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FilterOption)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            style={{ color: '#374151' }}
          >
            <option value="open">{t('conversationFilters.open')}</option>
            <option value="new">{t('conversationFilters.new')}</option>
            <option value="in_progress">{t('conversationFilters.inProgress')}</option>
            <option value="no_answer">{t('conversationFilters.noAnswer')}</option>
            <option value="won">{t('conversationFilters.won')}</option>
            <option value="lost">{t('conversationFilters.lost')}</option>
            <option value="closed">{t('conversationFilters.closed')}</option>
          </select>
        </div>

        {/* Show Mine Only Toggle - Enhanced Style */}
        <label className="flex items-center gap-3 cursor-pointer select-none px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="relative">
            <input
              type="checkbox"
              checked={showMineOnly}
              onChange={(e) => setShowMineOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
          <span className="text-sm font-medium" style={{ color: '#374151' }}>
            {t('conversations.showOnlyMyConversations')}
          </span>
        </label>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <div className="text-red-500 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-neutral-600 font-medium">{t('common.error')}</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4 max-w-sm">
              <div className="text-neutral-300 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              {isFiltered ? (
                <>
                  <p className="text-sm text-neutral-600 font-medium mb-3">
                    {t('conversations.noConversationsAssigned')}
                  </p>
                  <button
                    onClick={() => setShowMineOnly(false)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    {t('conversations.showAllConversations')}
                  </button>
                </>
              ) : (
                <p className="text-sm text-neutral-500 font-medium">
                  {t('conversations.noConversations')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isFetchingNextPage && (
                <LoadingSpinner />
              )}
              {!hasNextPage && conversations.length > 0 && (
                <p className="text-xs text-center py-4" style={{ color: '#9CA3AF' }}>
                  {conversations.length === totalConversations
                    ? 'All conversations loaded'
                    : 'No more conversations'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

