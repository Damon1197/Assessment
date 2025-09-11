import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ProctoringMonitorProps {
  assignmentId: string;
  onSessionStart?: (sessionId: string) => void;
  onViolationDetected?: (violation: any) => void;
  onSessionEnd?: () => void;
}

interface ProctoringSession {
  id: string;
  status: 'active' | 'paused' | 'completed' | 'violated';
  violations: any[];
  webcamEnabled: boolean;
  screenShareDetection: boolean;
  browserLockdown: boolean;
}

export default function ProctoringMonitor({ 
  assignmentId, 
  onSessionStart,
  onViolationDetected,
  onSessionEnd 
}: ProctoringMonitorProps) {
  const [session, setSession] = useState<ProctoringSession | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [violations, setViolations] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start proctoring session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/proctoring/start", {
        assignmentId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSession(data.session);
      onSessionStart?.(data.sessionId);
      initializeWebcam();
      setupBrowserSecurity();
    },
    onError: (error) => {
      console.error("Failed to start proctoring session:", error);
    }
  });

  // End proctoring session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!session) return;
      const response = await apiRequest("POST", `/api/proctoring/${session.id}/end`);
      return response.json();
    },
    onSuccess: () => {
      cleanup();
      onSessionEnd?.();
    }
  });

  // Analyze webcam frame mutation
  const analyzeFrameMutation = useMutation({
    mutationFn: async (imageData: string) => {
      if (!session) return null;
      const response = await apiRequest("POST", `/api/proctoring/${session.id}/analyze-frame`, {
        imageData
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.violations.length > 0) {
        setViolations(prev => [...prev, ...data.violations]);
        data.violations.forEach((violation: any) => {
          onViolationDetected?.(violation);
        });
      }
    }
  });

  // Report browser event mutation
  const reportEventMutation = useMutation({
    mutationFn: async ({ eventType, details }: { eventType: string, details: string }) => {
      if (!session) return;
      const response = await apiRequest("POST", `/api/proctoring/${session.id}/report-event`, {
        eventType,
        details
      });
      return response.json();
    }
  });

  // Initialize webcam
  const initializeWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: false 
      });
      
      streamRef.current = stream;
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start periodic analysis
      startPeriodicAnalysis();
      
    } catch (error) {
      console.error("Camera access denied:", error);
      setCameraPermission('denied');
    }
  };

  // Start periodic webcam frame analysis
  const startPeriodicAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    analysisIntervalRef.current = setInterval(() => {
      captureAndAnalyzeFrame();
    }, 10000); // Analyze every 10 seconds
  };

  // Capture and analyze webcam frame
  const captureAndAnalyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !session) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    // Send for analysis
    analyzeFrameMutation.mutate(imageData);
  }, [session, analyzeFrameMutation]);

  // Setup browser security controls
  const setupBrowserSecurity = () => {
    // Request fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((error) => {
        console.warn("Fullscreen request failed:", error);
      });
    }

    // Add event listeners for security monitoring
    setupSecurityEventListeners();
  };

  // Setup security event listeners
  const setupSecurityEventListeners = () => {
    // Detect tab switching / window focus loss
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        reportEventMutation.mutate({
          eventType: 'tab_switch',
          details: `Tab switched or window lost focus. Count: ${tabSwitchCount + 1}`
        });
      }
    };

    // Detect window blur
    const handleWindowBlur = () => {
      reportEventMutation.mutate({
        eventType: 'window_blur',
        details: 'Assessment window lost focus'
      });
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && session?.status === 'active') {
        reportEventMutation.mutate({
          eventType: 'unauthorized_app',
          details: 'Exited fullscreen mode during proctored assessment'
        });
      }
    };

    // Prevent common cheating shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Alt+Tab, Ctrl+Shift+I (DevTools), F11, F12, etc.
      const prohibitedKeys = [
        { key: 'Tab', altKey: true },
        { key: 'I', ctrlKey: true, shiftKey: true },
        { key: 'F11' },
        { key: 'F12' },
        { key: 'Escape' }
      ];

      const isProhibited = prohibitedKeys.some(prohibited => 
        e.key === prohibited.key &&
        (prohibited.altKey ? e.altKey : true) &&
        (prohibited.ctrlKey ? e.ctrlKey : true) &&
        (prohibited.shiftKey ? e.shiftKey : true)
      );

      if (isProhibited) {
        e.preventDefault();
        e.stopPropagation();
        
        reportEventMutation.mutate({
          eventType: 'unauthorized_app',
          details: `Attempted to use prohibited key combination: ${e.key}`
        });
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Store cleanup functions
    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };

    // Store cleanup function for later use
    (window as any).proctoringCleanup = cleanup;
  };

  // Cleanup function
  const cleanup = () => {
    // Stop webcam
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear analysis interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    // Remove security event listeners
    if ((window as any).proctoringCleanup) {
      (window as any).proctoringCleanup();
    }

    setSession(null);
    setViolations([]);
    setTabSwitchCount(0);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div className="proctoring-monitor">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Proctoring Monitor</span>
            {session && (
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                {session.status.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Status */}
          <div className="flex items-center justify-between">
            <span>Camera Status:</span>
            <Badge variant={cameraPermission === 'granted' ? 'default' : 'destructive'}>
              {cameraPermission === 'granted' ? 'Active' : 'Not Authorized'}
            </Badge>
          </div>

          {/* Fullscreen Status */}
          <div className="flex items-center justify-between">
            <span>Fullscreen:</span>
            <Badge variant={isFullscreen ? 'default' : 'destructive'}>
              {isFullscreen ? 'Active' : 'Disabled'}
            </Badge>
          </div>

          {/* Tab Switch Count */}
          <div className="flex items-center justify-between">
            <span>Tab Switch Count:</span>
            <Badge variant={tabSwitchCount === 0 ? 'default' : 'destructive'}>
              {tabSwitchCount}
            </Badge>
          </div>

          {/* Violations Count */}
          <div className="flex items-center justify-between">
            <span>Violations:</span>
            <Badge variant={violations.length === 0 ? 'default' : 'destructive'}>
              {violations.length}
            </Badge>
          </div>

          {/* Start/End Session Buttons */}
          <div className="flex space-x-2">
            {!session ? (
              <Button 
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
                className="w-full"
              >
                {startSessionMutation.isPending ? 'Starting...' : 'Start Proctoring'}
              </Button>
            ) : (
              <Button 
                onClick={() => endSessionMutation.mutate()}
                disabled={endSessionMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {endSessionMutation.isPending ? 'Ending...' : 'End Proctoring'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera Access Denied Alert */}
      {cameraPermission === 'denied' && (
        <Alert className="mb-4">
          <AlertDescription>
            Camera access is required for proctored assessments. Please enable camera permissions and refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Violations */}
      {violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.slice(-5).map((violation, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <Badge variant="destructive" className="mr-2">
                      {violation.severity}
                    </Badge>
                    <span className="text-sm">{violation.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden video and canvas elements */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}