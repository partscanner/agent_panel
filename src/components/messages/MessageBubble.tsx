import type { Message } from '../../types/message';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isInbound = message.direction === 'inbound';
  const time = format(new Date(message.timestamp), 'HH:mm');

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm ${
          isInbound
            ? 'bg-white text-neutral-900'
            : 'bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
        <div
          className={`flex items-center gap-1 text-[10px] mt-1.5 ${
            isInbound ? 'text-neutral-400' : 'text-white/80'
          }`}
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

