import { useState } from 'react';
import type { ReactElement } from 'react';
import type { Message } from '../../types/message';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

interface CollapsibleMessageProps {
  text: string;
  isInbound: boolean;
  maxChars?: number;
}

// Helper function to linkify URLs in text
const linkify = (text: string, isInbound: boolean): (string | ReactElement)[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add URL as link
    const url = match[0];
    parts.push(
      <a
        key={`link-${keyCounter++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all hover:opacity-80 transition-opacity"
        style={{ color: isInbound ? '#2563EB' : '#FFFFFF' }}
      >
        {url}
      </a>
    );
    
    lastIndex = match.index + url.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

const CollapsibleMessage = ({ text, isInbound, maxChars = 260 }: CollapsibleMessageProps) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > maxChars;
  
  const displayText = isLong && !expanded ? text.substring(0, maxChars) + '…' : text;
  const linkedContent = linkify(displayText, isInbound);
  
  return (
    <div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {linkedContent}
      </p>
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs font-medium underline opacity-80 hover:opacity-100 transition-opacity"
          style={{ color: isInbound ? '#111827' : '#FFFFFF' }}
        >
          Read more…
        </button>
      )}
    </div>
  );
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isInbound = message.direction === 'inbound';
  
  // Safe date handling
  let time = '';
  try {
    time = format(new Date(message.timestamp), 'HH:mm');
  } catch (e) {
    console.error('[MessageBubble] Error formatting timestamp:', e, message);
    time = 'now';
  }

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className="max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm"
        style={{
          backgroundColor: isInbound ? '#E5E7EB' : '#2563EB',
          color: isInbound ? '#111827' : '#FFFFFF'
        }}
      >
        <CollapsibleMessage text={message.text} isInbound={isInbound} />
        <div
          className="flex items-center gap-1 text-[10px] mt-1.5"
          style={{ color: isInbound ? '#6B7280' : 'rgba(255, 255, 255, 0.8)' }}
        >
          <span>{time}</span>
          {!isInbound && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

