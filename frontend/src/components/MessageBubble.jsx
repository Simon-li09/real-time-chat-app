import React from 'react';

const MessageBubble = ({ message, isMe }) => {
  const time = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const renderContent = () => {
    if (message.message_type === 'video') {
      return (
        <div className="rounded-lg overflow-hidden my-1 bg-black">
          <video 
            src={message.file_url || message.message_text} 
            controls 
            className="max-w-full h-auto max-h-72"
          />
        </div>
      );
    }

    if (message.message_type === 'voice' || message.message_type === 'image') {
      return (
        <p className="leading-relaxed whitespace-pre-wrap break-words text-slate-600">
          Unsupported attachment
        </p>
      );
    }

    return <p className="leading-relaxed whitespace-pre-wrap break-words">{message.message_text || message.text}</p>;
  };

  return (
    <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm relative ${
          isMe
            ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
            : 'bg-white text-slate-800 rounded-tl-none'
        }`}
      >
        <div className="text-sm md:text-[14.5px] pr-8">{renderContent()}</div>
        <div className={`flex items-center justify-end gap-1 mt-0.5 absolute bottom-1 right-2`}>
          <span className="text-[10px] text-slate-500/80">{time}</span>
          {isMe && (
            <span className={`text-[10px] ${message.is_read ? 'text-blue-500' : 'text-slate-400'}`}>
              {message.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
