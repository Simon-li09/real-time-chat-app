import { motion } from 'framer-motion';

const MobileNavbar = ({ onOpenSidebar, onOpenStatus, onOpenSettings }) => {
  return (
    <motion.nav
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/95 px-4 py-3 backdrop-blur-xl md:hidden"
    >
      <button
        onClick={onOpenSidebar}
        className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
      >
        Chats
      </button>
      <button
        onClick={onOpenStatus}
        className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
      >
        Status
      </button>
      <button
        onClick={onOpenSettings}
        className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
      >
        Settings
      </button>
    </motion.nav>
  );
};

export default MobileNavbar;
