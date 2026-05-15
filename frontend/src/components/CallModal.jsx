import React, { useState, useEffect, useRef } from 'react';
import socketService from '../sockets/socket';

const CallModal = ({ caller, isIncoming, onEnd }) => {
    const [status, setStatus] = useState(isIncoming ? 'incoming' : 'calling');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const pcRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const candidateQueue = useRef([]);

    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const cleanup = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        onEnd();
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
                    if (event.candidate && pcRef.current?.signalingState !== 'closed') {
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
                    if (String(data.from) !== String(caller.id)) return;
                    if (!pcRef.current || pcRef.current.signalingState === 'closed') return;

                    const { type, offer, answer, candidate } = data.signal;

                    if (type === 'offer' && isIncoming) {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                        setStatus('ringing');
                        // Process queued candidates
                        while (candidateQueue.current.length > 0) {
                            const cand = candidateQueue.current.shift();
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
                        }
                    } else if (type === 'answer') {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                        setStatus('connected');
                        // Process queued candidates
                        while (candidateQueue.current.length > 0) {
                            const cand = candidateQueue.current.shift();
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
                        }
                    } else if (type === 'candidate') {
                        if (pcRef.current.remoteDescription) {
                            try {
                                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                            } catch (e) {
                                console.error('Error adding candidate:', e);
                            }
                        } else {
                            candidateQueue.current.push(candidate);
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
    }, [caller.id]);

    const handleAccept = async () => {
        if (!pcRef.current || pcRef.current.signalingState === 'closed') return;

        try {
            // Prefer remoteDescription presence (more reliable than signalingState)
            if (!pcRef.current.remoteDescription) {
                console.warn('[CallModal] Accept pressed but remoteDescription missing. Waiting 300ms...');
                await new Promise(r => setTimeout(r, 300));
            }

            if (!pcRef.current.remoteDescription) {
                console.warn('[CallModal] Accept aborted: remoteDescription still missing');
                return;
            }

            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socketService.send('rtc_signal', {
                to: caller.id,
                signal: { type: 'answer', answer }
            });
            setStatus('connected');
        } catch (err) {
            console.error('[CallModal] Failed to accept call:', err);
        }
    };

    const handleEnd = () => {
        socketService.send('rtc_signal', { to: caller.id, signal: { type: 'end' } });
        cleanup();
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#0b141a] pb-12 pt-20 text-white animate-in fade-in duration-300">
            
            {/* Remote Video (Full Screen) */}
            {remoteStream && status === 'connected' && (
                <div className="absolute inset-0 z-0 bg-black">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
                </div>
            )}

            {/* Local Video (PIP) */}
            {localStream && status === 'connected' && (
                <div className="absolute top-16 right-6 w-28 aspect-[3/4] bg-slate-800 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl z-20">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
            )}

            <div className="flex flex-col items-center z-10 text-center">
                <p className="mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500">
                    {status === 'incoming' ? 'Incoming call' : status === 'ringing' ? 'Ringing' : status === 'calling' ? 'Calling' : 'Connected'}
                </p>
                
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-5xl font-bold text-emerald-500 shadow-2xl">
                    {caller.username?.charAt(0).toUpperCase()}
                </div>
                
                <h2 className="mt-6 text-3xl font-medium tracking-tight">{caller.username}</h2>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    lee call
                </div>
            </div>

            <div className="w-full max-w-md px-10 z-10">
                
                {status === 'connected' && (
                    <div className="mb-12 grid grid-cols-4 gap-4 text-center">
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl transition group-hover:bg-white/20">🎤</div>
                            <span className="text-[10px] text-slate-400">Mute</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl transition group-hover:bg-white/20">🔊</div>
                            <span className="text-[10px] text-slate-400">Speaker</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl transition group-hover:bg-white/20">📹</div>
                            <span className="text-[10px] text-slate-400">Video</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl transition group-hover:bg-white/20">💬</div>
                            <span className="text-[10px] text-slate-400">Chat</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-center gap-16">
                    <button 
                        onClick={handleEnd}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl shadow-xl transition-transform active:scale-90"
                    >
                        📞
                    </button>
                    
                    {status === 'incoming' && (
                        <button 
                            onClick={handleAccept}
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-2xl shadow-xl transition-transform animate-bounce active:scale-90"
                        >
                            📞
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
