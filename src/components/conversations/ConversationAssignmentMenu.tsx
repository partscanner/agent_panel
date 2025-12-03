import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useAgents, useAssignConversation } from '../../hooks/useConversations';

interface ConversationAssignmentMenuProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
  position?: 'left' | 'right';
}

export const ConversationAssignmentMenu = ({
  conversationId,
  isOpen,
  onClose,
  trigger,
  position = 'right',
}: ConversationAssignmentMenuProps) => {
  const { t } = useTranslation();
  const { agent: currentAgent } = useAuth();
  const { data: agents } = useAgents();
  const assignConversation = useAssignConversation();
  const [isAgentListOpen, setIsAgentListOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset internal state when menu is closed
  useEffect(() => {
    if (!isOpen) {
      console.log('[AssignmentMenu] Menu closed, resetting internal state');
      setIsAgentListOpen(false);
    }
  }, [isOpen]);

  const handleAssignToMe = async () => {
    if (!currentAgent) return;
    console.log('[AssignmentMenu] Assigning to me:', currentAgent.id);
    try {
      await assignConversation.mutateAsync({ conversationId, agentId: currentAgent.id });
      console.log('[AssignmentMenu] Assignment successful');
    } catch (error) {
      console.error('[AssignmentMenu] Failed to assign conversation:', error);
    } finally {
      // Always close the menu, even if there was an error
      onClose();
    }
  };

  const handleClearAssignment = async () => {
    console.log('[AssignmentMenu] Clearing assignment');
    try {
      await assignConversation.mutateAsync({ conversationId, agentId: null });
      console.log('[AssignmentMenu] Assignment cleared successfully');
    } catch (error) {
      console.error('[AssignmentMenu] Failed to clear assignment:', error);
    } finally {
      // Always close the menu, even if there was an error
      onClose();
    }
  };

  const handleAssignToAgent = async (agentId: string) => {
    console.log('[AssignmentMenu] Assigning to agent:', agentId);
    try {
      await assignConversation.mutateAsync({ conversationId, agentId });
      console.log('[AssignmentMenu] Assignment successful');
    } catch (error) {
      console.error('[AssignmentMenu] Failed to assign conversation:', error);
    } finally {
      // Always close the menu and collapse the agent list
      setIsAgentListOpen(false);
      onClose();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('[AssignmentMenu] Click outside detected, closing menu');
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
        className={`absolute ${position === 'right' ? 'ltr:right-0 rtl:left-0' : 'ltr:left-0 rtl:right-0'} mt-2 w-72 rounded-xl shadow-xl bg-white border border-gray-100 z-50`}
        style={{ top: '100%' }}
      >
        <div className="py-2">
          {/* Primary Actions Section */}
          <div className="px-2 pb-2">
            {/* Assign to Me */}
            <button
              onClick={handleAssignToMe}
              disabled={assignConversation.isPending}
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
              disabled={assignConversation.isPending}
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
              className="w-full ltr:text-left rtl:text-right px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-all rounded-lg flex items-center justify-between gap-3"
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

            {/* Agent List - Improved design with name/email on separate lines */}
            {isAgentListOpen && agents && agents.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg bg-gray-50 border border-gray-200">
                {/* List Header */}
                <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>
                    {t('conversation.assignToSomeone')}
                  </p>
                </div>
                
                {/* Agent Items */}
                <div className="py-1">
                  {agents.filter(a => a.id !== currentAgent?.id).map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAssignToAgent(agent.id)}
                      disabled={assignConversation.isPending}
                      className="w-full ltr:text-left rtl:text-right px-4 py-3 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                      style={{ minHeight: '60px' }}
                    >
                      <div className="flex flex-col gap-1">
                        {/* Agent Name - Primary */}
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
                        {/* Agent Email - Secondary */}
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
        </div>
      </div>
    </div>
  );
};

