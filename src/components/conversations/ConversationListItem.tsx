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

  // Calculate effective unread count based on last message direction
  const unreadCount = conversation.unreadCount ?? 0;
  const lastMessageDirection = conversation.lastMessageDirection;
  
  // Only show badge if:
  // 1. unreadCount > 0
  // 2. Last message is from customer (inbound) OR direction is unknown
  const shouldShowBadge = unreadCount > 0 && 
    (!lastMessageDirection || lastMessageDirection === 'inbound');
  
  // Debug log for unread badge
  console.log('[ConversationListItem] Unread badge', {
    id: conversation.id,
    displayName,
    lastMessageDirection,
    unreadCount,
    shouldShowBadge,
  });

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
          
          {/* Context Info & Assigned Agent */}
          {(conversation.context || conversation.assignedAgent) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Assigned Agent Badge */}
              {conversation.assignedAgent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md" style={{ color: '#1E40AF', backgroundColor: '#DBEAFE' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {conversation.assignedAgent.name}
                </span>
              )}
              {conversation.context?.plate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md" style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {conversation.context.plate}
                </span>
              )}
              {conversation.context?.partDescription && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md truncate max-w-[150px]" style={{ color: '#1F2937', backgroundColor: '#E5E7EB' }}>
                  🔧 {conversation.context.partDescription}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Time and Unread Badge - Right Side */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{lastMessageTime}</span>
          {shouldShowBadge && (
            <span className="inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full px-2 text-xs font-semibold shadow-md" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

