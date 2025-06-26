import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Copy, User, PhoneCall, MicIcon, MicOffIcon, Volume2, VolumeX, Shield } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useAudioDevices } from "@/hooks/use-audio-devices";
import { CallInterface } from "@/components/call-interface";
import { IncomingCallModal } from "@/components/incoming-call-modal";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

export default function Home() {
  const [userID, setUserID] = useState<string>("");
  const [targetUserID, setTargetUserID] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  
  const { toast } = useToast();
  const { socket, isConnected } = useWebSocket();
  const { 
    localStream, 
    remoteStream, 
    isCallActive, 
    isMuted, 
    callDuration,
    connectedUserID,
    initiateCall, 
    endCall, 
    acceptCall, 
    rejectCall,
    toggleMute,
    incomingCall,
    setIncomingCall
  } = useWebRTC(socket, userID);
  
  const { 
    audioDevices, 
    selectedMicrophone, 
    selectedSpeaker,
    setSelectedMicrophone,
    setSelectedSpeaker,
    testAudio
  } = useAudioDevices();

  // Generate user ID on mount
  useEffect(() => {
    const savedUserID = localStorage.getItem('voiceconnect_userid');
    if (savedUserID) {
      setUserID(savedUserID);
    } else {
      const newUserID = `user-${nanoid(8)}`;
      setUserID(newUserID);
      localStorage.setItem('voiceconnect_userid', newUserID);
    }
  }, []);

  // Update connection status based on socket
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  // Check audio permission status
  useEffect(() => {
    const checkAudioPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setHasAudioPermission(result.state === 'granted');
          
          result.addEventListener('change', () => {
            setHasAudioPermission(result.state === 'granted');
          });
        }
      } catch (error) {
        // Fallback: try to access media to check permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasAudioPermission(true);
        } catch {
          setHasAudioPermission(false);
        }
      }
    };

    checkAudioPermission();
  }, []);

  const requestAudioPermission = async () => {
    try {
      // Try with simplified constraints first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (detailedError) {
        // Fallback to basic audio request
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      stream.getTracks().forEach(track => track.stop());
      setHasAudioPermission(true);
      toast({
        title: "Permission Granted",
        description: "Microphone access enabled successfully",
      });
    } catch (error) {
      console.error("Failed to get audio permission:", error);
      let errorMessage = "Please allow microphone access to use voice calling";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Microphone access was denied. Please click the microphone icon in your browser's address bar to allow access.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone detected. Please connect a microphone and try again.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Your browser doesn't support microphone access. Try using Chrome, Firefox, or Safari.";
        }
      }
      
      toast({
        title: "Permission Denied",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCopyUserID = async () => {
    try {
      await navigator.clipboard.writeText(userID);
      toast({
        title: "Copied!",
        description: "User ID copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy user ID to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleInitiateCall = () => {
    if (!targetUserID.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID to call",
        variant: "destructive"
      });
      return;
    }
    
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to signaling server",
        variant: "destructive"
      });
      return;
    }

    initiateCall(targetUserID.trim());
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-success';
      case 'connecting': return 'bg-warning';
      case 'disconnected': return 'bg-neutral';
      default: return 'bg-neutral';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting';
      case 'disconnected': return 'Disconnected';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">VoiceConnect</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 ${getConnectionStatusColor()} rounded-full`} />
                <span className="text-neutral">{getConnectionStatusText()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Call Setup Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Start a Call</h2>
                
                {/* User ID Input */}
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Your ID</Label>
                  <div className="relative">
                    <Input 
                      value={userID}
                      readOnly
                      className="bg-gray-50 font-mono text-sm pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={handleCopyUserID}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Share this ID with others to receive calls</p>
                </div>

                {/* Call Target Input */}
                <div className="mb-6">
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Call User ID</Label>
                  <Input 
                    placeholder="Enter user ID to call"
                    value={targetUserID}
                    onChange={(e) => setTargetUserID(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Call Button */}
                <Button 
                  onClick={handleInitiateCall}
                  disabled={isCallActive || !isConnected || (!hasAudioPermission && !demoMode)}
                  className="w-full"
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  {demoMode ? "Demo Call" : (!hasAudioPermission ? "Microphone Required" : "Start Call")}
                </Button>
              </CardContent>
            </Card>

            {/* Audio Settings */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Settings</h3>
                
                {/* Audio Permission Warning */}
                {!hasAudioPermission && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-800 font-medium">Microphone Setup</p>
                        <p className="text-xs text-blue-700 mt-1">
                          To make voice calls, you'll need a microphone connected to your device. 
                          Once connected, click below to enable access.
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <Button 
                            size="sm" 
                            onClick={requestAudioPermission}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Check Microphone
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setDemoMode(true);
                              toast({
                                title: "Demo Mode",
                                description: "Interface preview enabled - microphone not required",
                              });
                            }}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            Preview Interface
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Microphone Selection */}
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Microphone</Label>
                  <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.microphones.filter(device => device.deviceId).map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Speaker Selection */}
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Speaker</Label>
                  <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select speaker" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.speakers.filter(device => device.deviceId).map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audio Test */}
                <Button 
                  variant="outline" 
                  onClick={testAudio}
                  className="w-full"
                  disabled={!hasAudioPermission}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Test Audio
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Call Section */}
          <div className="lg:col-span-2">
            <CallInterface
              isCallActive={isCallActive}
              connectedUserID={connectedUserID}
              callDuration={formatDuration(callDuration)}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onEndCall={endCall}
              localStream={localStream}
              remoteStream={remoteStream}
            />
          </div>
        </div>
      </main>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          callerID={incomingCall.from}
          onAccept={() => {
            acceptCall(incomingCall);
            setIncomingCall(null);
          }}
          onReject={() => {
            rejectCall(incomingCall);
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}
