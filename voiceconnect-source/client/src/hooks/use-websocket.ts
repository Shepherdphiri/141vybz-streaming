import { useEffect, useRef, useState } from "react";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      try {
        socketRef.current = new WebSocket(wsUrl);
        
        socketRef.current.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
        };
        
        socketRef.current.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };
        
        socketRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };
        
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected
  };
}
