import { AnimatePresence, motion } from 'framer-motion';

const CallScreen = ({ activeCall, onAccept, onReject, onEnd }) => {
  return (
    <AnimatePresence>
      {activeCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/95 p-4"
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="w-full max-w-lg rounded-4xl bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/60 ring-1 ring-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-2xl font-bold text-white">
                {activeCall.caller?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-white">{activeCall.caller?.username || 'Unknown Caller'}</p>
                <p className="text-sm text-slate-400">{activeCall.isIncoming ? 'Incoming call' : 'Active call'}</p>
              </div>
              <span className="ml-auto inline-flex rounded-3xl bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                {activeCall.type || 'Audio'}
              </span>
            </div>

            <div className="mt-6 space-y-3 rounded-4xl bg-slate-950/80 p-4 text-sm text-slate-400 shadow-inner shadow-slate-950/40">
              <p className="text-slate-300">{activeCall.isIncoming ? 'Swipe to answer or decline the call.' : 'Your call is in progress.'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Caller</p>
                  <p className="mt-2 text-base font-semibold text-white">{activeCall.caller?.username}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <p className="mt-2 text-base font-semibold text-emerald-400">{activeCall.isIncoming ? 'Ringing' : 'Connected'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {activeCall.isIncoming ? (
                <>
                  <button
                    onClick={onAccept}
                    className="flex-1 rounded-3xl bg-emerald-500 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  >
                    Accept
                  </button>
                  <button
                    onClick={onReject}
                    className="flex-1 rounded-3xl bg-slate-800 px-4 py-4 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  onClick={onEnd}
                  className="w-full rounded-3xl bg-rose-500 px-4 py-4 text-sm font-semibold text-white transition hover:bg-rose-400"
                >
                  End Call
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallScreen;
