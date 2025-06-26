import { Button } from "@/components/ui/button";
import { User, PhoneOff, Phone } from "lucide-react";

interface IncomingCallModalProps {
  callerID: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({ callerID, onAccept, onReject }: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="text-white h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{callerID}</h3>
          <p className="text-gray-500 mb-6">Incoming voice call</p>
          
          <div className="flex space-x-4">
            <Button 
              variant="destructive"
              onClick={onReject}
              className="flex-1"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button 
              onClick={onAccept}
              className="flex-1 bg-success hover:bg-green-600"
            >
              <Phone className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
