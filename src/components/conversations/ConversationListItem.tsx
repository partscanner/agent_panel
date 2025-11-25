import { Conversation } from '../../types/conversation';
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
  const displayName = conversation.customerPhone || conversation.customerId;
  const lastMessageTime = formatDistanceToNow(new Date(conversation.lastMessageAt), {
    addSuffix: true,
  });

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h3>
            {conversation.unreadCount && conversation.unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded-full">
                {conversation.unreadCount}
              </span>
            )}
          </div>
          {conversation.lastMessage && (
            <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
          )}
          {conversation.context && (
            <div className="mt-1 text-xs text-gray-500">
              {conversation.context.plate && (
                <span className="mr-2">🚗 {conversation.context.plate}</span>
              )}
              {conversation.context.partDescription && (
                <span>🔧 {conversation.context.partDescription}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-500">{lastMessageTime}</div>
    </div>
  );
};

