import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
  selectedUser,
  messages,
  currentUserId,
  newMessage,
  onMessageChange,
  onSendMessage,
  onStartRecording,
  isRecording,
  wsStatus,
  onBack,
  onOpenCall,
  isMutual,
  typingUser,
}) => {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-950 text-white">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-4 py-4 shadow-sm md:px-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-900/80 text-slate-200 transition hover:bg-slate-800 md:hidden"
                aria-label="Back to chats"
              >
                ←
              </button>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-600/10 text-emerald-300 font-semibold">
              {selectedUser?.username?.charAt(0).toUpperCase() || selectedUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{selectedUser?.is_group ? selectedUser.name : selectedUser?.username}</p>
              <p className="truncate text-xs text-slate-400">
                {typingUser ? `${typingUser} is typing...` : onlineUsersLabel(selectedUser, currentUserId)}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button onClick={onOpenCall} className="rounded-3xl bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
              Call
            </button>
            <button className="rounded-3xl bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
              Info
            </button>
          </div>
        </div>
        {wsStatus !== 'connected' && (
          <div className="mt-3 rounded-3xl bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-500/20">
            Connection: <span className="font-semibold">{wsStatus}</span>
          </div>
        )}
      </motion.header>

      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
              Select a conversation or start a new chat to begin messaging.
            </div>
          ) : (
            messages.map((message, index) => {
              const senderId = message.sender?.id || message.sender || message.sender_id;
              const isMe = String(senderId) === String(currentUserId);
              return <MessageBubble key={message.id || index} message={message} isMe={isMe} />;
            })
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 z-20 border-t border-slate-800/80 bg-slate-950/95 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="grid gap-3">
          {!isMutual && !selectedUser?.is_group ? (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              You can only message mutual followers.
            </div>
          ) : null}

          {isRecording ? (
            <div className="rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-4 text-sm text-slate-200">
              Recording voice note... Tap the mic again to stop.
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 px-3 py-3 shadow-lg shadow-slate-950/20">
              <button
                type="button"
                onClick={onStartRecording}
                className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500 text-white transition hover:bg-emerald-400"
              >
                🎙️
              </button>
              <form onSubmit={onSendMessage} className="flex-1">
                <label className="sr-only">Message</label>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder="Type a message"
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-emerald-500 focus:bg-slate-950"
                />
              </form>
              <button
                onClick={onSendMessage}
                className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500 text-white transition hover:bg-emerald-400"
                type="button"
              >
                ➤
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

const onlineUsersLabel = (selectedUser, currentUserId) => {
  if (!selectedUser) return 'No conversation selected';
  if (selectedUser.is_group) return 'Group chat';
  return 'Active now';
};

export default ChatWindow;
