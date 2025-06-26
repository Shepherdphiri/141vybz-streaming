import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export function useAudioDevices() {
  const [audioDevices, setAudioDevices] = useState<{
    microphones: AudioDevice[];
    speakers: AudioDevice[];
  }>({
    microphones: [],
    speakers: []
  });
  
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  
  const { toast } = useToast();

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia not supported');
        }

        // First get basic device list
        let devices = await navigator.mediaDevices.enumerateDevices();
        
        const microphones = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
            kind: device.kind
          }));
          
        const speakers = devices
          .filter(device => device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`,
            kind: device.kind
          }));

        // Always provide at least default devices
        const finalMicrophones = microphones.length > 0 ? microphones : 
          [{ deviceId: 'default', label: 'Default Microphone', kind: 'audioinput' as MediaDeviceKind }];
        const finalSpeakers = speakers.length > 0 ? speakers : 
          [{ deviceId: 'default', label: 'Default Speaker', kind: 'audiooutput' as MediaDeviceKind }];

        setAudioDevices({ 
          microphones: finalMicrophones, 
          speakers: finalSpeakers 
        });
        
        // Set defaults if not already set
        if (!selectedMicrophone && finalMicrophones.length > 0) {
          setSelectedMicrophone(finalMicrophones[0].deviceId);
        }
        
        if (!selectedSpeaker && finalSpeakers.length > 0) {
          setSelectedSpeaker(finalSpeakers[0].deviceId);
        }
        
      } catch (error) {
        console.error("Failed to enumerate devices:", error);
        
        // Provide default devices even if enumeration fails
        setAudioDevices({
          microphones: [{ deviceId: 'default', label: 'Default Microphone', kind: 'audioinput' }],
          speakers: [{ deviceId: 'default', label: 'Default Speaker', kind: 'audiooutput' }]
        });
        
        if (!selectedMicrophone) {
          setSelectedMicrophone('default');
        }
        if (!selectedSpeaker) {
          setSelectedSpeaker('default');
        }
      }
    };

    getDevices();
    
    // Listen for device changes
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', getDevices);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', getDevices);
      };
    }
  }, []);

  const testAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined
        }
      });
      
      // Create audio context for testing
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      
      // Test for 2 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        
        toast({
          title: "Audio Test Complete",
          description: "Microphone is working properly.",
        });
      }, 2000);
      
      toast({
        title: "Testing Audio",
        description: "Testing microphone for 2 seconds...",
      });
      
    } catch (error) {
      console.error("Audio test failed:", error);
      toast({
        title: "Audio Test Failed",
        description: "Failed to test audio. Please check your microphone.",
        variant: "destructive"
      });
    }
  };

  return {
    audioDevices,
    selectedMicrophone,
    selectedSpeaker,
    setSelectedMicrophone,
    setSelectedSpeaker,
    testAudio
  };
}
