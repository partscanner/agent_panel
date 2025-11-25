import type { Conversation } from '../../types/conversation';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationListItem = ({
  conversation,
  isActive,
  onClick,
}: ConversationListItemProps) => {
  // Debug log
  console.log('[ConversationListItem] Rendering conversation:', conversation);
  
  // Priority: displayName > userName > userPhone > customerPhone > customerId > 'Unknown'
  const displayName = conversation.displayName 
    || conversation.userName 
    || conversation.userPhone 
    || conversation.customerPhone 
    || conversation.customerId 
    || 'Unknown';
  
  // Safe date handling
  let lastMessageTime = 'recently';
  try {
    if (conversation.lastMessageAt) {
      lastMessageTime = formatDistanceToNow(new Date(conversation.lastMessageAt), {
        addSuffix: true,
      });
    }
  } catch (e) {
    console.error('[ConversationListItem] Error formatting date:', e);
  }

  return (
    <div
      onClick={onClick}
      className={`relative px-5 py-4 border-b cursor-pointer transition-all ${
        isActive 
          ? 'border-l-4 border-l-blue-600 shadow-sm' 
          : 'hover:bg-neutral-50 border-l-4 border-l-transparent'
      }`}
      style={{ 
        backgroundColor: isActive ? '#EFF6FF' : 'transparent',
        borderBottomColor: '#E5E7EB'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold truncate" style={{ color: '#111827' }}>
              {displayName}
            </h3>
          </div>
          
          {/* Last Message */}
          {conversation.lastMessage && (
            <p className="text-xs truncate mb-2" style={{ color: '#111827' }}>{conversation.lastMessage}</p>
          )}
          
          {/* Context Info */}
          {conversation.context && (conversation.context.plate || conversation.context.partDescription) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {conversation.context.plate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md" style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {conversation.context.plate}
                </span>
              )}
              {conversation.context.partDescription && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md truncate max-w-[150px]" style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}>
                  🔧 {conversation.context.partDescription}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Time and Unread Badge - Right Side */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{lastMessageTime}</span>
          {conversation.unreadCount && conversation.unreadCount > 0 && (
            <span className="inline-flex min-w-[24px] justify-center rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

