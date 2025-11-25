import { Message } from '../../types/message';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isInbound = message.direction === 'inbound';
  const time = format(new Date(message.timestamp), 'HH:mm');

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg ${
          isInbound
            ? 'bg-white border border-gray-200 text-gray-900'
            : 'bg-blue-600 text-white'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div
          className={`text-xs mt-1 ${isInbound ? 'text-gray-500' : 'text-blue-100'}`}
        >
          {time}
        </div>
      </div>
    </div>
  );
};

