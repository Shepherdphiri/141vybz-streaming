import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (stream && isActive) {
      // Create audio context and analyser
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevels = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Convert to normalized levels for visualization
          const levels = Array.from({ length: 20 }, (_, i) => {
            const startIndex = Math.floor((i / 20) * bufferLength);
            const endIndex = Math.floor(((i + 1) / 20) * bufferLength);
            
            let sum = 0;
            for (let j = startIndex; j < endIndex; j++) {
              sum += dataArray[j];
            }
            
            const average = sum / (endIndex - startIndex);
            return Math.min(average / 255, 1); // Normalize to 0-1
          });
          
          setAudioLevels(levels);
        }
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      };

      updateAudioLevels();
    } else {
      // Reset to zero levels when not active
      setAudioLevels(Array(20).fill(0));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, isActive]);

  return (
    <div className="flex items-center justify-center space-x-1">
      {audioLevels.map((level, index) => {
        const height = Math.max(4, level * 20 + 4); // Min height 4px, max ~24px
        const isActive = level > 0.1;
        
        return (
          <div
            key={index}
            className={`w-1 rounded-full transition-all duration-150 ${
              isActive ? 'bg-primary' : 'bg-gray-300'
            }`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}
