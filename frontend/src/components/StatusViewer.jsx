import React, { useState, useEffect } from 'react';

const StatusViewer = ({ statuses, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const currentStatus = statuses[currentIndex];

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (currentIndex < statuses.length - 1) {
                        setCurrentIndex(prevIndex => prevIndex + 1);
                        return 0;
                    } else {
                        onClose();
                        return 100;
                    }
                }
                return prev + 1;
            });
        }, 50); // 5 seconds total (100 * 50ms)

        return () => clearInterval(timer);
    }, [currentIndex, statuses.length, onClose]);

    const handleNext = () => {
        if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    if (!currentStatus) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col">
            {/* Progress Bars */}
            <div className="flex p-3 gap-1.5 z-10">
                {statuses.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-300 ease-linear"
                            style={{ 
                                width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' 
                            }}
                        ></div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center p-4 z-10">
                <div className="w-10 h-10 rounded-full bg-slate-200 mr-3 overflow-hidden border-2 border-white/20">
                    {currentStatus?.user?.profile_picture ? (
                        <img src={currentStatus.user.profile_picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-500 text-white font-bold">
                            {currentStatus?.user?.username?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="text-white">
                    <p className="font-bold text-sm">{currentStatus?.user?.username}</p>
                    <p className="text-[10px] opacity-60 font-medium">
                        {new Date(currentStatus.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <button onClick={onClose} className="ml-auto text-white/70 hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-between px-4 z-10 pointer-events-none">
                    <button onClick={handlePrev} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white pointer-events-auto backdrop-blur-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button onClick={handleNext} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white pointer-events-auto backdrop-blur-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>

                <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                        src={currentStatus.media.startsWith('http') ? currentStatus.media : `http://127.0.0.1:8000${currentStatus.media}`} 
                        alt={currentStatus.caption} 
                        className="max-w-full max-h-full object-contain"
                    />
                    {currentStatus.caption && (
                        <div className="absolute bottom-10 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
                            <p className="text-lg font-medium drop-shadow-md">{currentStatus.caption}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusViewer;
