import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useAgents, useAssignConversation, useUpdateWorkflowStatus } from '../../hooks/useConversations';
import type { Conversation } from '../../types/conversation';

interface ConversationActionsMenuProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}

export const ConversationActionsMenu = ({
  conversation,
  isOpen,
  onClose,
  trigger,
  align = 'right',
}: ConversationActionsMenuProps) => {
  const { t } = useTranslation();
  const { agent: currentAgent } = useAuth();
  const { data: agents } = useAgents();
  const assignConversation = useAssignConversation();
  const updateWorkflowStatus = useUpdateWorkflowStatus();
  const [isAgentListOpen, setIsAgentListOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isClosed = conversation.status === 'closed';
  const isPending = assignConversation.isPending || updateWorkflowStatus.isPending;

  // Reset internal state when menu is closed
  useEffect(() => {
    if (!isOpen) {
      setIsAgentListOpen(false);
    }
  }, [isOpen]);

  const handleAssignToMe = async () => {
    if (!currentAgent) return;
    try {
      await assignConversation.mutateAsync({ conversationId: conversation.id, agentId: currentAgent.id });
    } catch (error) {
      console.error('[ActionsMenu] Failed to assign conversation:', error);
    } finally {
      onClose();
    }
  };

  const handleClearAssignment = async () => {
    try {
      await assignConversation.mutateAsync({ conversationId: conversation.id, agentId: null });
    } catch (error) {
      console.error('[ActionsMenu] Failed to clear assignment:', error);
    } finally {
      onClose();
    }
  };

  const handleAssignToAgent = async (agentId: string) => {
    try {
      await assignConversation.mutateAsync({ conversationId: conversation.id, agentId });
    } catch (error) {
      console.error('[ActionsMenu] Failed to assign conversation:', error);
    } finally {
      setIsAgentListOpen(false);
      onClose();
    }
  };

  const handleSetWorkflowStatus = async (workflowStatus: 'in_progress' | 'won' | 'lost') => {
    try {
      await updateWorkflowStatus.mutateAsync({ conversationId: conversation.id, workflowStatus });
    } catch (error) {
      console.error('[ActionsMenu] Failed to update workflow status:', error);
    } finally {
      onClose();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAgentListOpen(false);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return trigger || null;

  return (
    <div className="relative" ref={menuRef}>
      {trigger}
      
      {/* Dropdown Menu - RTL aware, modern design */}
      <div 
        className={`absolute ${align === 'right' ? 'ltr:right-0 rtl:left-0' : 'ltr:left-0 rtl:right-0'} mt-2 w-72 rounded-xl shadow-xl bg-white border border-gray-100 z-50`}
        style={{ top: '100%' }}
      >
        <div className="py-2">
          {/* Assignment Actions Section */}
          <div className="px-2 pb-2">
            {/* Assign to Me */}
            <button
              onClick={handleAssignToMe}
              disabled={isPending}
              className="w-full ltr:text-left rtl:text-right px-4 py-3 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg flex items-center gap-3 group"
              style={{ color: '#1F2937', minHeight: '44px' }}
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="group-hover:text-blue-700">{t('conversation.assignToMe')}</span>
            </button>

            {/* Clear Assignment */}
            <button
              onClick={handleClearAssignment}
              disabled={isPending}
              className="w-full ltr:text-left rtl:text-right px-4 py-3 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg flex items-center gap-3 group mt-1"
              style={{ color: '#1F2937', minHeight: '44px' }}
            >
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="group-hover:text-red-600">{t('conversation.clearAssignment')}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Assign to Another Agent Section */}
          <div className="px-2">
            <button
              onClick={() => setIsAgentListOpen(!isAgentListOpen)}
              disabled={isPending}
              className="w-full ltr:text-left rtl:text-right px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg flex items-center justify-between gap-3"
              style={{ color: '#1F2937', minHeight: '44px' }}
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{t('conversation.assignToSomeone')}</span>
              </span>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isAgentListOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Agent List */}
            {isAgentListOpen && agents && agents.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg bg-gray-50 border border-gray-200">
                <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>
                    {t('conversation.assignToSomeone')}
                  </p>
                </div>
                
                <div className="py-1">
                  {agents.filter(a => a.id !== currentAgent?.id).map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAssignToAgent(agent.id)}
                      disabled={isPending}
                      className="w-full ltr:text-left rtl:text-right px-4 py-3 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                      style={{ minHeight: '60px' }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-600">
                              {agent.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                            {agent.name}
                          </span>
                        </div>
                        <div className="ltr:ml-10 rtl:mr-10">
                          <span className="text-xs text-gray-500 truncate block">
                            {agent.email}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Workflow Status Actions Section */}
          {!isClosed && (
            <>
              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              <div className="px-2">
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>
                    {t('workflowStatusMenu.label')}
                  </p>
                </div>

                {/* Set In Progress */}
                <button
                  onClick={() => handleSetWorkflowStatus('in_progress')}
                  disabled={isPending}
                  className="w-full ltr:text-left rtl:text-right px-4 py-3 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg flex items-center gap-3 group mt-1"
                  style={{ color: '#1F2937', minHeight: '44px' }}
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="group-hover:text-blue-700">{t('workflowStatusMenu.setInProgress')}</span>
                </button>

                {/* Set Won */}
                <button
                  onClick={() => handleSetWorkflowStatus('won')}
                  disabled={isPending}
                  className="w-full ltr:text-left rtl:text-right px-4 py-3 text-sm font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg flex items-center gap-3 group mt-1"
                  style={{ color: '#1F2937', minHeight: '44px' }}
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="group-hover:text-emerald-700">{t('workflowStatusMenu.setWon')}</span>
                </button>

                {/* Set Lost */}
                <button
                  onClick={() => handleSetWorkflowStatus('lost')}
                  disabled={isPending}
                  className="w-full ltr:text-left rtl:text-right px-4 py-3 text-sm font-medium hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg flex items-center gap-3 group mt-1"
                  style={{ color: '#1F2937', minHeight: '44px' }}
                >
                  <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="group-hover:text-rose-700">{t('workflowStatusMenu.setLost')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

