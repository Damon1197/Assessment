import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Violation {
  id?: string;
  assignmentId: string;
  candidateId: string;
  eventType: 'suspicious_behavior' | 'tab_switch' | 'window_blur' | 'multiple_faces' | 'no_face' | 'screen_share' | 'unauthorized_app' | 'plagiarism_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  evidence?: string;
  aiAnalysis?: string;
  resolved: boolean;
}

interface ProctoringSession {
  id: string;
  assignmentId: string;
  candidateId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'violated';
  violations: Violation[];
  webcamEnabled: boolean;
  screenShareDetection: boolean;
  browserLockdown: boolean;
}

interface ProctoringDashboardProps {
  userRole: 'super_admin' | 'sme' | 'manager_hr';
}

export default function ProctoringDashboard({ userRole }: ProctoringDashboardProps) {
  const [selectedSession, setSelectedSession] = useState<ProctoringSession | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'violated' | 'completed'>('all');
  const { toast } = useToast();

  // Fetch active proctoring sessions (mock query - implement based on your backend)
  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['proctoring-sessions', filter],
    queryFn: async () => {
      // This would be a real API call to fetch proctoring sessions
      // For now, return mock data for demonstration
      const mockSessions: ProctoringSession[] = [
        {
          id: 'session_1',
          assignmentId: 'assignment_123',
          candidateId: 'candidate_456',
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'active',
          violations: [
            {
              assignmentId: 'assignment_123',
              candidateId: 'candidate_456',
              eventType: 'tab_switch',
              severity: 'medium',
              description: 'Candidate switched browser tab',
              timestamp: new Date(Date.now() - 1800000), // 30 min ago
              resolved: false
            }
          ],
          webcamEnabled: true,
          screenShareDetection: true,
          browserLockdown: true
        },
        {
          id: 'session_2',
          assignmentId: 'assignment_789',
          candidateId: 'candidate_101',
          startTime: new Date(Date.now() - 7200000), // 2 hours ago
          endTime: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'completed',
          violations: [],
          webcamEnabled: true,
          screenShareDetection: true,
          browserLockdown: true
        }
      ];
      
      return filter === 'all' ? mockSessions : mockSessions.filter(s => s.status === filter);
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Resolve violation mutation
  const resolveViolationMutation = useMutation({
    mutationFn: async ({ sessionId, violationId }: { sessionId: string, violationId: string }) => {
      // This would be a real API call to resolve violations
      console.log(`Resolving violation ${violationId} in session ${sessionId}`);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Violation Resolved",
        description: "The violation has been marked as resolved.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve violation.",
        variant: "destructive",
      });
    }
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("POST", `/api/proctoring/${sessionId}/end`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Terminated",
        description: "The proctoring session has been terminated.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to terminate session.",
        variant: "destructive",
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'violated': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000 / 60);
    return `${duration} min`;
  };

  return (
    <div className="proctoring-dashboard space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proctoring Dashboard</h2>
          <p className="text-muted-foreground">Monitor active assessments and security violations</p>
        </div>
        
        {/* Status Filters */}
        <div className="flex space-x-2">
          {(['all', 'active', 'violated', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">Active Sessions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {sessions.reduce((acc, s) => acc + s.violations.filter(v => !v.resolved).length, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Unresolved Violations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {sessions.reduce((acc, s) => acc + s.violations.filter(v => v.severity === 'critical').length, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Critical Violations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Proctoring Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No proctoring sessions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Violations</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-sm">
                      {session.id.slice(-8)}
                    </TableCell>
                    <TableCell>{session.candidateId}</TableCell>
                    <TableCell>
                      <Badge className={`text-white ${getStatusColor(session.status)}`}>
                        {session.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDuration(session.startTime, session.endTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {session.violations.map((violation, index) => (
                          <Badge
                            key={index}
                            className={`text-white text-xs ${getSeverityColor(violation.severity)} ${
                              violation.resolved ? 'opacity-50' : ''
                            }`}
                          >
                            {violation.severity.charAt(0).toUpperCase()}
                          </Badge>
                        ))}
                        {session.violations.length === 0 && (
                          <span className="text-green-600 text-sm">Clean</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSession(session)}
                            >
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Session Details - {selectedSession?.id}</DialogTitle>
                            </DialogHeader>
                            <SessionDetailsModal session={selectedSession} />
                          </DialogContent>
                        </Dialog>
                        
                        {session.status === 'active' && userRole === 'super_admin' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => terminateSessionMutation.mutate(session.id)}
                            disabled={terminateSessionMutation.isPending}
                          >
                            Terminate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Violations Alert */}
      {sessions.some(s => s.violations.some(v => !v.resolved && v.severity === 'critical')) && (
        <Alert>
          <AlertDescription>
            <strong>Critical violations detected!</strong> Review and resolve high-priority security violations immediately.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Session Details Modal Component
function SessionDetailsModal({ session }: { session: ProctoringSession | null }) {
  if (!session) return null;

  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-6 p-4">
        {/* Session Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Session Information</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p><strong>ID:</strong> {session.id}</p>
              <p><strong>Assignment:</strong> {session.assignmentId}</p>
              <p><strong>Candidate:</strong> {session.candidateId}</p>
              <p><strong>Status:</strong> 
                <Badge className={`ml-2 text-white ${session.status === 'active' ? 'bg-green-500' : 
                  session.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'}`}>
                  {session.status.toUpperCase()}
                </Badge>
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold">Security Settings</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p><strong>Webcam:</strong> {session.webcamEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
              <p><strong>Screen Share Detection:</strong> {session.screenShareDetection ? '✅ Enabled' : '❌ Disabled'}</p>
              <p><strong>Browser Lockdown:</strong> {session.browserLockdown ? '✅ Enabled' : '❌ Disabled'}</p>
            </div>
          </div>
        </div>

        {/* Violations */}
        <div>
          <h4 className="font-semibold mb-3">Violations ({session.violations.length})</h4>
          {session.violations.length === 0 ? (
            <p className="text-green-600">No violations detected - Clean session</p>
          ) : (
            <div className="space-y-3">
              {session.violations.map((violation, index) => (
                <Card key={index} className={violation.resolved ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`text-white ${
                            violation.severity === 'low' ? 'bg-yellow-500' :
                            violation.severity === 'medium' ? 'bg-orange-500' :
                            violation.severity === 'high' ? 'bg-red-500' : 'bg-red-700'
                          }`}>
                            {violation.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {violation.eventType.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {violation.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(violation.timestamp).toLocaleString()}
                        </p>
                        
                        {violation.aiAnalysis && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-blue-600">
                              AI Analysis
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                              {JSON.stringify(JSON.parse(violation.aiAnalysis), null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        {violation.resolved ? (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline">
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}