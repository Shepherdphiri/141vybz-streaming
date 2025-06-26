import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SignalingMessage } from "@shared/schema";

interface IncomingCall {
  from: string;
  offer: RTCSessionDescriptionInit;
}

export function useWebRTC(socket: WebSocket | null, userID: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectedUserID, setConnectedUserID] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize user media
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia not supported in this browser');
        }

        // Try to get user media with fallback approach
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }, 
            video: false 
          });
        } catch (detailedError) {
          // Fallback to basic audio request
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        setLocalStream(stream);
      } catch (error) {
        console.error("Failed to get user media:", error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to access microphone.";
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = "Microphone access denied. Please allow microphone access and reload the page.";
          } else if (error.name === 'NotFoundError') {
            errorMessage = "No microphone found. Please connect a microphone and try again.";
          } else if (error.name === 'NotSupportedError') {
            errorMessage = "Your browser doesn't support microphone access.";
          }
        }
        
        toast({
          title: "Microphone Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // WebSocket message handler
  useEffect(() => {
    if (!socket || !userID) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const message: SignalingMessage = JSON.parse(event.data);
        
        if (message.to !== userID) return;

        switch (message.type) {
          case 'call-request':
            setIncomingCall({
              from: message.from,
              offer: message.data
            });
            break;
            
          case 'call-response':
            if (message.data.accepted) {
              await handleCallAccepted(message.data.answer);
            } else {
              handleCallRejected();
            }
            break;
            
          case 'offer':
            await handleOffer(message.from, message.data);
            break;
            
          case 'answer':
            await handleAnswer(message.data);
            break;
            
          case 'ice-candidate':
            await handleIceCandidate(message.data);
            break;
            
          case 'call-end':
            handleCallEnded();
            break;
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, userID]);

  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && connectedUserID) {
        const message: SignalingMessage = {
          type: 'ice-candidate',
          from: userID,
          to: connectedUserID,
          data: event.candidate
        };
        socket.send(JSON.stringify(message));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsCallActive(true);
        startCallTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleCallEnded();
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    return pc;
  }, [socket, userID, connectedUserID, localStream]);

  const initiateCall = async (targetUserID: string) => {
    try {
      if (!socket || !localStream) {
        throw new Error("WebSocket not connected or no local stream");
      }

      setConnectedUserID(targetUserID);
      peerConnectionRef.current = createPeerConnection();

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      const message: SignalingMessage = {
        type: 'call-request',
        from: userID,
        to: targetUserID,
        data: offer
      };

      socket.send(JSON.stringify(message));
      
      toast({
        title: "Calling...",
        description: `Calling ${targetUserID}`,
      });
    } catch (error) {
      console.error("Failed to initiate call:", error);
      toast({
        title: "Call Failed",
        description: "Failed to initiate call. Please try again.",
        variant: "destructive"
      });
    }
  };

  const acceptCall = async (call: IncomingCall) => {
    try {
      if (!socket || !localStream) {
        throw new Error("WebSocket not connected or no local stream");
      }

      setConnectedUserID(call.from);
      peerConnectionRef.current = createPeerConnection();

      await peerConnectionRef.current.setRemoteDescription(call.offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      const message: SignalingMessage = {
        type: 'call-response',
        from: userID,
        to: call.from,
        data: { accepted: true, answer }
      };

      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("Failed to accept call:", error);
      toast({
        title: "Call Failed",
        description: "Failed to accept call. Please try again.",
        variant: "destructive"
      });
    }
  };

  const rejectCall = (call: IncomingCall) => {
    if (!socket) return;

    const message: SignalingMessage = {
      type: 'call-response',
      from: userID,
      to: call.from,
      data: { accepted: false }
    };

    socket.send(JSON.stringify(message));
  };

  const endCall = () => {
    if (socket && connectedUserID) {
      const message: SignalingMessage = {
        type: 'call-end',
        from: userID,
        to: connectedUserID
      };
      socket.send(JSON.stringify(message));
    }

    handleCallEnded();
  };

  const handleCallAccepted = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error("Failed to handle call accepted:", error);
    }
  };

  const handleCallRejected = () => {
    toast({
      title: "Call Rejected",
      description: "The user declined your call.",
      variant: "destructive"
    });
    handleCallEnded();
  };

  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    // This is handled in the call-request message
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error("Failed to handle answer:", error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error("Failed to handle ICE candidate:", error);
    }
  };

  const handleCallEnded = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsCallActive(false);
    setConnectedUserID(null);
    setRemoteStream(null);
    stopCallTimer();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  };

  return {
    localStream,
    remoteStream,
    isCallActive,
    isMuted,
    callDuration,
    connectedUserID,
    incomingCall,
    setIncomingCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute
  };
}
