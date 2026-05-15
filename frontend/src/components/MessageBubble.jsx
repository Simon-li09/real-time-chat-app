import { motion } from 'framer-motion';

const MessageBubble = ({ message, isMe }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    if (message.message_type === 'image') {
      return (
        <img
          src={message.file_url || message.message_text}
          alt="Shared" 
          className="max-w-full rounded-3xl object-cover shadow-sm"
          loading="lazy"
        />
      );
    }

    if (message.message_type === 'video') {
      return (
        <video 
          src={message.file_url || message.message_text}
          controls
          className="max-w-full rounded-3xl shadow-sm"
        />
      );
    }

    if (message.message_type === 'voice') {
      return (
        <div className="rounded-3xl bg-slate-900/10 p-3">
          <audio 
            src={message.file_url || message.message_text}
            controls
            className="w-full"
          />
        </div>
      );
    }

    return <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.message_text}</p>;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] rounded-3xl border px-4 py-3 shadow-sm transition-all duration-300 ${
          isMe
            ? 'bg-emerald-600 text-white border-emerald-700/30 rounded-br-none'
            : 'bg-white text-slate-900 border-slate-200 rounded-bl-none'
        }`}
      >
        <div className="text-sm md:text-base">{renderContent()}</div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] leading-none text-slate-500">
          <span>{formatTime(message.created_at)}</span>
          {isMe && (
            <span className="text-emerald-100">
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
