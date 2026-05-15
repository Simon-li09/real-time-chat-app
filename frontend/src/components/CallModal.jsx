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
                // DEBUG: helps verify whether offer/answer/candidate arrive
                console.log('[CallModal] rtc pc created. isIncoming=', isIncoming, 'caller.id=', caller.id);
                const unsubSignal = socketService.on('rtc_signal', async (data) => {
                    console.log('[CallModal] rtc_signal received', data);
                    if (!pcRef.current) {
                        console.warn('[CallModal] pcRef.current missing; dropping rtc_signal');
                        return;
                    }
                    if (String(data.from) !== String(caller.id)) return;
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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#111b21] pb-12 pt-20 text-white animate-in fade-in transition-all duration-500">
            
            {/* Remote Video (Full Screen if active) */}
            {remoteStream && (
                <div className="absolute inset-0 z-0 bg-black">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                </div>
            )}

            {/* Local Video (PIP) */}
            {localStream && status === 'connected' && (
                <div className="absolute top-16 right-6 w-24 aspect-[3/4] bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
            )}

            <div className="flex flex-col items-center z-10">
                <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-emerald-500">
                    {status === 'incoming' ? 'Incoming call...' : status === 'ringing' ? 'Ringing...' : status === 'calling' ? 'Calling...' : '00:15'}
                </p>
                
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100 text-5xl font-bold text-emerald-700 shadow-2xl">
                    {caller.username.charAt(0).toUpperCase()}
                </div>
                
                <h2 className="mt-6 text-3xl font-light capitalize">{caller.username}</h2>
                {status !== 'connected' && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Online
                    </div>
                )}
            </div>

            <div className="w-full max-w-md px-10 z-10">
                
                {status !== 'incoming' && (
                    <div className="mb-12 grid grid-cols-3 gap-y-8 text-center text-xs text-gray-400">
                        <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white">🎤</div>
                            Mute
                        </button>
                        <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white">⋮⋮⋮</div>
                            Keypad
                        </button>
                        <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white">🔊</div>
                            Speaker
                        </button>
                        <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white">+</div>
                            Add call
                        </button>
                        <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white">📹</div>
                            Video
                        </button>
                        <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white">...</div>
                            More
                        </button>
                    </div>
                )}

                <div className={`flex items-center ${status === 'incoming' ? 'justify-around' : 'justify-center'}`}>
                    <button 
                        onClick={handleEnd}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl shadow-lg transition-transform hover:scale-110"
                    >
                        📞
                    </button>
                    
                    {status === 'incoming' && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-bounce text-gray-500">↑↑↑</div>
                            <button 
                                onClick={handleAccept}
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-2xl shadow-lg transition-transform hover:scale-110"
                            >
                                📞
                            </button>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default CallModal;
