import { useConversation } from "@11labs/react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Mic, MicOff, Loader2, User } from "lucide-react";
import { useToast } from "./ui/use-toast";

interface VoiceAgentProps {
  agentId: string;
  agentName: string;
  agentBio?: string;
  agentLlm?: string;
}

const VoiceAgent = ({ agentId, agentName, agentBio, agentLlm }: VoiceAgentProps) => {
  const { toast } = useToast();
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to agent");
      toast({
        title: "Connected",
        description: `Now speaking with ${agentName}`,
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from agent");
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the agent. Please try again.",
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log("Message received:", message);
    },
  });

  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsPermissionGranted(true);
      toast({
        title: "Microphone Access Granted",
        description: "You can now start a conversation",
      });
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice features",
        variant: "destructive",
      });
    }
  };

  const startConversation = async () => {
    if (!isPermissionGranted) {
      await requestMicrophoneAccess();
      return;
    }

    setIsInitializing(true);
    try {
      await conversation.startSession({ 
        agentId,
        connectionType: 'webrtc'
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Failed to Start",
        description: "Could not connect to the agent",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const stopConversation = async () => {
    await conversation.endSession();
  };

  useEffect(() => {
    return () => {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
    };
  }, []);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer glow effect when speaking */}
        {isConnected && isSpeaking && (
          <div
            className="absolute inset-0 rounded-full bg-white/20 animate-pulse blur-2xl"
            style={{ animationDuration: '1.5s' }}
          />
        )}
        
        {/* Main sound wave bubble */}
        <div
          className={`relative rounded-full transition-all duration-500 flex items-center justify-center shadow-2xl ${
            isConnected
              ? isSpeaking
                ? "w-48 h-48 bg-white shadow-[0_0_60px_rgba(255,255,255,0.8)]"
                : "w-44 h-44 bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              : "w-40 h-40 bg-[#000000]"
          }`}
        >
          {/* Person icon when not connected */}
          {!isConnected && !isInitializing && (
            <User className="w-16 h-16 text-white" strokeWidth={1.5} />
          )}
          
          {/* Sound wave bars */}
          {isConnected && (
            <div className="absolute inset-0 flex items-center justify-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 bg-primary rounded-full transition-all ${
                    isSpeaking ? 'animate-pulse' : ''
                  }`}
                  style={{
                    height: isSpeaking 
                      ? `${30 + Math.abs(2 - i) * 15}%` 
                      : '20%',
                    animationDuration: `${0.6 + i * 0.1}s`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Loading state */}
          {isInitializing && (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          )}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">{agentName}</h3>
        {agentBio && (
          <p className="text-white/90 text-base max-w-md mx-auto">
            {agentBio}
          </p>
        )}
        {agentLlm && (
          <p className="text-white/70 text-sm font-medium">
            LLM: {agentLlm}
          </p>
        )}
        <p className="text-white/80 text-lg">
          {isConnected
            ? isSpeaking
              ? "Agent is speaking..."
              : "Listening..."
            : "Ready to connect"}
        </p>
      </div>

      {!isConnected ? (
        <Button
          onClick={startConversation}
          disabled={isInitializing}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-10 py-7 text-xl font-bold rounded-xl transition-all shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.4)] hover:scale-105"
        >
          {isInitializing ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Connecting...
            </>
          ) : (
            "Start Conversation"
          )}
        </Button>
      ) : (
        <Button
          onClick={stopConversation}
          size="lg"
          className="bg-white hover:bg-white/90 text-primary px-10 py-7 text-xl font-bold rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
        >
          End Conversation
        </Button>
      )}
    </div>
  );
};

export default VoiceAgent;
