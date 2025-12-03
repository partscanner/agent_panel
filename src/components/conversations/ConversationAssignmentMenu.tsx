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

  const handleAssignToMe = async () => {
    if (!currentAgent) return;
    try {
      await assignConversation.mutateAsync({ conversationId, agentId: currentAgent.id });
      onClose();
    } catch (error) {
      console.error('Failed to assign conversation:', error);
    }
  };

  const handleClearAssignment = async () => {
    try {
      await assignConversation.mutateAsync({ conversationId, agentId: null });
      onClose();
    } catch (error) {
      console.error('Failed to clear assignment:', error);
    }
  };

  const handleAssignToAgent = async (agentId: string) => {
    try {
      await assignConversation.mutateAsync({ conversationId, agentId });
      onClose();
      setIsAgentListOpen(false);
    } catch (error) {
      console.error('Failed to assign conversation:', error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
        setIsAgentListOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return trigger || null;

  return (
    <div className="relative" ref={menuRef}>
      {trigger}
      
      {/* Dropdown Menu - RTL aware */}
      <div 
        className={`absolute ${position === 'right' ? 'ltr:right-0 rtl:left-0' : 'ltr:left-0 rtl:right-0'} mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50`}
        style={{ top: '100%' }}
      >
        <div className="py-1">
          {/* Assign to Me */}
          <button
            onClick={handleAssignToMe}
            disabled={assignConversation.isPending}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            style={{ color: '#374151' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('conversation.assignToMe')}
          </button>

          {/* Clear Assignment */}
          <button
            onClick={handleClearAssignment}
            disabled={assignConversation.isPending}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            style={{ color: '#374151' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('conversation.clearAssignment')}
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 my-1"></div>

          {/* Assign to Another Agent */}
          <button
            onClick={() => setIsAgentListOpen(!isAgentListOpen)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between gap-2"
            style={{ color: '#374151' }}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t('conversation.assignToSomeone')}
            </span>
            <svg className={`w-4 h-4 transition-transform ${isAgentListOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Agent List */}
          {isAgentListOpen && agents && agents.length > 0 && (
            <div className="bg-gray-50 max-h-48 overflow-y-auto">
              {agents.filter(a => a.id !== currentAgent?.id).map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAssignToAgent(agent.id)}
                  disabled={assignConversation.isPending}
                  className="w-full text-left px-8 py-2 text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ color: '#374151' }}
                >
                  {agent.name}
                  <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>({agent.email})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

