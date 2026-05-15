import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusViewer = ({ statuses, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const currentStatus = statuses?.[currentIndex];

  useEffect(() => {
    if (!statuses?.length) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
            return 0;
          }
          onClose();
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, statuses, onClose]);

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {currentStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col bg-slate-950/95 text-white"
        >
          <div className="flex p-3 gap-1.5">
            {statuses.map((_, index) => (
              <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500 text-xl font-semibold text-slate-950">
              {currentStatus?.user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{currentStatus?.user?.username}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {new Date(currentStatus?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={onClose} className="ml-auto rounded-3xl bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
              Close
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden p-4">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/10 to-slate-950/70" />
            <motion.div
              className="relative mx-auto flex h-full max-w-4xl items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/40"
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
            >
              <img
                src={currentStatus.media?.startsWith('http') ? currentStatus.media : `http://127.0.0.1:8000${currentStatus.media}`}
                alt={currentStatus.caption || 'Status'}
                className="max-h-[75vh] w-full max-w-full rounded-[1.75rem] object-contain"
              />
              {currentStatus.caption && (
                <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-slate-950/80 px-5 py-4 text-center text-sm text-white/90 shadow-xl shadow-slate-950/40">
                  {currentStatus.caption}
                </div>
              )}
            </motion.div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-800/60 bg-slate-950/95 p-4">
            <button
              onClick={handlePrev}
              className="flex-1 rounded-3xl bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex-1 rounded-3xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusViewer;
