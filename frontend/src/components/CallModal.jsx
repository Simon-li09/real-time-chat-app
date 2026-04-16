import React, { useState, useEffect, useRef } from 'react';
import socketService from '../sockets/socket';

const CallModal = ({ caller, isIncoming, onEnd }) => {
    const [status, setStatus] = useState(isIncoming ? 'incoming' : 'calling');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const pcRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    useEffect(() => {
        const startCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                pcRef.current = new RTCPeerConnection(configuration);
                stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

                pcRef.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketService.send('rtc_signal', {
                            to: caller.id,
                            signal: { type: 'candidate', candidate: event.candidate }
                        });
                    }
                };

                pcRef.current.ontrack = (event) => {
                    setRemoteStream(event.streams[0]);
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
                };

                if (!isIncoming) {
                    const offer = await pcRef.current.createOffer();
                    await pcRef.current.setLocalDescription(offer);
                    socketService.send('rtc_signal', {
                        to: caller.id,
                        signal: { type: 'offer', offer }
                    });
                }

                // Signaling Listeners
                const unsubSignal = socketService.on('rtc_signal', async (data) => {
                    if (data.from != caller.id) return;
                    const { type, offer, answer, candidate } = data.signal;

                    if (type === 'offer' && isIncoming) {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                        setStatus('ringing');
                    } else if (type === 'answer') {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                        setStatus('connected');
                    } else if (type === 'candidate') {
                        try {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (e) {
                            console.error('Error adding received ice candidate', e);
                        }
                    } else if (type === 'end') {
                        cleanup();
                    }
                });

                return () => {
                    unsubSignal();
                    cleanup();
                };
            } catch (err) {
                console.error('WebRTC error:', err);
                onEnd();
            }
        };

        startCall();
    }, [caller.id, isIncoming]);

    const handleAccept = async () => {
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socketService.send('rtc_signal', {
            to: caller.id,
            signal: { type: 'answer', answer }
        });
        setStatus('connected');
    };

    const handleEnd = () => {
        socketService.send('rtc_signal', { to: caller.id, signal: { type: 'end' } });
        cleanup();
    };

    const cleanup = () => {
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        if (pcRef.current) pcRef.current.close();
        onEnd();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[300] flex flex-col items-center justify-center p-6 transition-all duration-500 animate-in fade-in">
            <div className="w-full max-w-4xl h-full max-h-[80vh] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700/50 flex flex-col">
                
                {/* Remote Video (Full Screen) */}
                <div className="flex-1 bg-black relative">
                    {remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                            <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500 animate-pulse transition-all">
                                {caller.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">{caller.username}</h2>
                                <p className="text-sm text-slate-300 mb-1">Caller ID: {caller.id}</p>
                                <p className="text-emerald-400 font-mono tracking-widest uppercase text-sm animate-pulse">
                                    {status === 'incoming' ? 'Incoming Call...' : status === 'ringing' ? 'Ringing...' : 'Connecting...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Local Video (PIP) */}
                    <div className="absolute top-6 right-6 w-48 aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-10 transition-all hover:scale-110">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Controls Area */}
                <div className="p-8 bg-slate-900/80 backdrop-blur-md flex justify-center items-center space-x-12 z-20 border-t border-slate-700/50">
                    {status === 'incoming' || status === 'ringing' ? (
                        <button 
                            onClick={handleAccept}
                            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 active:scale-90"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H3.75A2.25 2.25 0 001.5 4.5v2.25z" />
                            </svg>
                        </button>
                    ) : null}

                    <button 
                        onClick={handleEnd}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110 active:scale-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 rotate-[135deg]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H3.75A2.25 2.25 0 001.5 4.5v2.25z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallModal;
