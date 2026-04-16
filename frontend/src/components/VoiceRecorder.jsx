import React, { useState, useRef } from 'react';

const VoiceRecorder = ({ onRecordingComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
                onRecordingComplete(file);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Recording failed:', err);
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-start on mount for better UX when clicking the mic
    React.useEffect(() => {
        startRecording();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, []);

    return (
        <div className="flex items-center bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex-1 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center space-x-3 w-full">
                {/* Pulsing indicator */}
                <div className="relative flex items-center justify-center w-3 h-3">
                    <div className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-75"></div>
                    <div className="relative w-2 h-2 rounded-full bg-red-600"></div>
                </div>
                
                <span className="text-sm font-bold text-emerald-700 font-mono tracking-tighter">
                    Recording: {formatTime(recordingTime)}
                </span>
                
                <div className="flex-1 flex justify-center">
                    {/* Visualizer placeholder or simple wave */}
                    <div className="flex items-end space-x-1 h-4">
                        {[4, 8, 12, 6, 10, 14, 5, 9].map((h, i) => (
                            <div 
                                key={i} 
                                className="w-1 bg-emerald-400 rounded-full animate-bounce" 
                                style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Cancel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <button 
                        type="button"
                        onClick={stopRecording}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-md shadow-emerald-200 transition-all active:scale-90"
                        title="Finish and Send"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceRecorder;
