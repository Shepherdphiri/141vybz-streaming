import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, PhoneOff, MicIcon, MicOffIcon, Volume2 } from "lucide-react";
import { AudioVisualizer } from "./audio-visualizer";

interface CallInterfaceProps {
  isCallActive: boolean;
  connectedUserID: string | null;
  callDuration: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export function CallInterface({ 
  isCallActive, 
  connectedUserID, 
  callDuration, 
  isMuted, 
  onToggleMute, 
  onEndCall,
  localStream,
  remoteStream
}: CallInterfaceProps) {
  
  const getCallStatus = () => {
    if (isCallActive) {
      return "Connected";
    }
    return "Ready to Call";
  };

  const getCallStatusDescription = () => {
    if (isCallActive) {
      return `Connected to ${connectedUserID}`;
    }
    return "Connect with someone using their User ID";
  };

  const getConnectionQuality = () => {
    if (isCallActive) {
      return "Good Signal";
    }
    return "Click \"Start Call\" to begin";
  };

  return (
    <Card>
      {/* Call Status Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{getCallStatus()}</h2>
            <p className="text-sm text-gray-500">{getCallStatusDescription()}</p>
          </div>
          {/* Call Duration */}
          <div className="text-right">
            <div className="text-2xl font-mono font-semibold text-gray-900">{callDuration}</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
        </div>
      </div>

      {/* Call Interface */}
      <CardContent className="p-8">
        {/* Connected User Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="text-white h-12 w-12" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {connectedUserID || "Not Connected"}
          </h3>
          <p className="text-sm text-gray-500">{getConnectionQuality()}</p>
        </div>

        {/* Audio Visualizer */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <AudioVisualizer 
              stream={localStream} 
              isActive={isCallActive && !isMuted} 
            />
            <p className="text-xs text-gray-500 text-center mt-2">Audio levels</p>
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center space-x-4">
          {/* Mute Button */}
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={onToggleMute}
            disabled={!isCallActive}
          >
            {isMuted ? (
              <MicOffIcon className="h-5 w-5 text-red-500" />
            ) : (
              <MicIcon className="h-5 w-5" />
            )}
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={onEndCall}
            disabled={!isCallActive}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          {/* Speaker Button */}
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full"
            disabled={!isCallActive}
          >
            <Volume2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Connection Quality Indicator */}
        {isCallActive && (
          <div className="mt-8 text-center">
            <div className="flex justify-center items-center space-x-2 text-sm">
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-success rounded-full"></div>
                <div className="w-1 h-3 bg-success rounded-full"></div>
                <div className="w-1 h-3 bg-success rounded-full"></div>
                <div className="w-1 h-3 bg-gray-300 rounded-full"></div>
                <div className="w-1 h-3 bg-gray-300 rounded-full"></div>
              </div>
              <span className="text-gray-600">Good Signal</span>
            </div>
          </div>
        )}

        {/* Audio Elements for Remote Stream */}
        {remoteStream && (
          <audio
            ref={(audio) => {
              if (audio && remoteStream) {
                audio.srcObject = remoteStream;
              }
            }}
            autoPlay
            className="hidden"
          />
        )}
      </CardContent>
    </Card>
  );
}
