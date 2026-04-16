import React from 'react';

const CallLog = ({ logs }) => {
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusProps = (log) => {
        if (log.status === 'missed') {
            return { label: 'Missed call', color: 'text-rose-500', icon: 'incoming' };
        }

        if (log.direction === 'outgoing') {
            return { label: log.type === 'video' ? 'Outgoing video call' : 'Outgoing call', color: 'text-emerald-600', icon: 'outgoing' };
        }

        return { label: log.type === 'video' ? 'Incoming video call' : 'Incoming call', color: 'text-slate-500', icon: 'incoming' };
    };

    const renderArrow = (icon) => {
        if (icon === 'outgoing') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="currentColor" d="M8.5 7.5L14 12l-5.5 4.5V7.5z" />
                </svg>
            );
        }

        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 rotate-180">
                <path fill="currentColor" d="M8.5 7.5L14 12l-5.5 4.5V7.5z" />
            </svg>
        );
    };

    const renderTypeIcon = (type) => {
        if (type === 'video') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="currentColor" d="M17 7.5h-9A2.5 2.5 0 005.5 10v4a2.5 2.5 0 002.5 2.5h9A2.5 2.5 0 0019.5 14v-4A2.5 2.5 0 0017 7.5zm0 6.5.001-4L22 8.5v7l-4.999-2.5z" />
                </svg>
            );
        }

        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 01.89-.27 11.41 11.41 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.41 11.41 0 00.57 3.58 1 1 0 01-.27.89l-2.18 2.32z" />
            </svg>
        );
    };

    const normalizedLogs = logs.map(log => ({
        ...log,
        type: log.type || 'audio',
    }));

    const incomingCount = normalizedLogs.filter(log => log.direction === 'incoming').length;
    const outgoingCount = normalizedLogs.filter(log => log.direction === 'outgoing').length;
    const missedCount = normalizedLogs.filter(log => log.status === 'missed').length;

    return (
        <div className="mt-4 p-4 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Calls</h3>
                        <p className="text-[11px] text-slate-400">Recent call activity across chats</p>
                    </div>
                    <span className="text-[11px] text-slate-400">{logs.length} entries</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Incoming</p>
                        <p className="text-lg font-bold text-slate-900">{incomingCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Outgoing</p>
                        <p className="text-lg font-bold text-slate-900">{outgoingCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Missed</p>
                        <p className="text-lg font-bold text-slate-900">{missedCount}</p>
                    </div>
                </div>
            </div>

            {logs.length === 0 ? (
                <div className="text-[13px] text-slate-500">No recent calls yet.</div>
            ) : (
                <ul className="space-y-3">
                    {normalizedLogs.map((log, index) => {
                        const status = getStatusProps(log);
                        return (
                            <li key={`${log.timestamp}-${index}`} className="rounded-3xl p-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-3xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-base shadow-sm">
                                        {log.caller.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{log.caller.username || `User ${log.caller.id}`}</p>
                                            <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${status.color}`}>
                                                {status.label.split(' ')[0]}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-500">
                                            <span className={`${status.color} inline-flex items-center justify-center`}>
                                                {renderArrow(status.icon)}
                                            </span>
                                            <span>{status.label}</span>
                                            <span className="inline-flex items-center gap-1 text-slate-400">
                                                {renderTypeIcon(log.type)}
                                                {formatTime(log.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default CallLog;
