import type { Message } from '../types/message';

/**
 * Compute unread count for a conversation.
 * Unread = number of inbound messages after the last outbound message.
 * If no outbound message exists, all inbound messages are unread.
 * If last message is outbound, unread count is 0.
 */
export function computeUnreadCount(messages: Message[]): number {
  if (!messages.length) return 0;

  // Find the last outbound (agent) message
  const lastAgentIndex = [...messages].reverse()
    .findIndex(m => m.direction === 'outbound');

  // Convert to position from start, or -1 if no outbound message
  const lastAgentPos =
    lastAgentIndex === -1 ? -1 : messages.length - 1 - lastAgentIndex;

  // Count inbound messages after the last agent message
  return messages
    .slice(lastAgentPos + 1)
    .filter(m => m.direction === 'inbound').length;
}

