import React from 'react';
import { MEDIA_URL } from '../services/api';

const MessageBubble = ({ message, isMe }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef(null);
  const time = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    if (message.message_type === 'voice') {
      const audioUrl = message.file_url || message.message_text;
      const fullUrl = audioUrl?.startsWith('http') ? audioUrl : `${MEDIA_URL}${audioUrl}`;
      
      return (
        <div className="flex items-center gap-2 min-w-[240px] py-1">
          {isMe && (
            <div className="relative h-10 w-10 flex-shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800/20 text-sm font-bold">
                {message.sender?.username?.charAt(0).toUpperCase() || 'E'}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[10px]">🎙️</span>
            </div>
          )}

          <button 
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center text-2xl text-slate-600 transition hover:scale-110"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-end gap-[2px] h-6 px-1">
              {[30, 60, 40, 80, 50, 70, 40, 90, 60, 30, 50, 80, 40, 60, 30, 70, 50, 40].map((h, i) => (
                <div 
                  key={i} 
                  className={`w-[2px] rounded-full ${i < 8 && isPlaying ? 'bg-emerald-500' : 'bg-slate-300'}`} 
                  style={{ height: `${h}%` }} 
                />
              ))}
            </div>
            <div className="text-[10px] text-slate-500">{formatDuration(duration)}</div>
          </div>

          {!isMe && (
            <div className="relative h-10 w-10 flex-shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800/20 text-sm font-bold overflow-hidden">
                {message.sender?.profile_picture ? (
                  <img src={message.sender.profile_picture} className="w-full h-full object-cover" />
                ) : (
                  message.sender?.username?.charAt(0).toUpperCase() || 'P'
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[10px]">🎙️</span>
            </div>
          )}
          
          <audio 
            ref={audioRef}
            src={fullUrl} 
            className="hidden" 
            onLoadedMetadata={() => setDuration(audioRef.current.duration)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      );
    }

    if (message.message_type === 'image') {
      const imageUrl = message.file_url || message.message_text;
      const fullUrl = imageUrl?.startsWith('http') ? imageUrl : `${MEDIA_URL}${imageUrl}`;
      return (
        <div className="max-w-sm overflow-hidden rounded-lg">
          <img 
            src={fullUrl} 
            alt="Message attachment"
            className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
          />
        </div>
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
