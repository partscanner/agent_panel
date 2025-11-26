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

  console.log('lastAgentIndex', lastAgentIndex);
  

  // Convert to position from start, or -1 if no outbound message
  const lastAgentPos =
    lastAgentIndex === -1 ? -1 : messages.length - 1 - lastAgentIndex;

  if (lastAgentPos === -1) {
    return 0;
  }

  console.log('lastAgentPos', lastAgentPos);
  console.log('messages.slice(lastAgentPos + 1)', messages.slice(lastAgentPos + 1));
  console.log('messages.slice(lastAgentPos + 1).filter(m => m.direction === "inbound").length', messages.slice(lastAgentPos + 1).filter(m => m.direction === "inbound").length);

  // Count inbound messages after the last agent message
  const unreadCount = messages.slice(lastAgentPos + 1).filter(m => m.direction === "inbound").length;
  console.log('unreadCount', unreadCount);
  return unreadCount
}

