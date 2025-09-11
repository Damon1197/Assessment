// DON'T DELETE THIS COMMENT
// Live Proctoring Service for Assessment Platform
// Implements AI-powered monitoring, behavior detection, and assessment integrity

import { GoogleGenAI } from "@google/genai";
import WebSocket from 'ws';
import { storage } from '../storage';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// Proctoring Event Types
export interface ProctoringEvent {
  id?: string;
  assignmentId: string;
  candidateId: string;
  eventType: 'suspicious_behavior' | 'tab_switch' | 'window_blur' | 'multiple_faces' | 'no_face' | 'screen_share' | 'unauthorized_app' | 'plagiarism_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  evidence?: string; // Base64 image or relevant data
  aiAnalysis?: string;
  resolved: boolean;
}

export interface ProctoringSession {
  id: string;
  assignmentId: string;
  candidateId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'violated';
  violations: ProctoringEvent[];
  webcamEnabled: boolean;
  screenShareDetection: boolean;
  browserLockdown: boolean;
}

// In-memory session storage (should be moved to database in production)
const activeSessions = new Map<string, ProctoringSession>();
const wsConnections = new Map<string, WebSocket>();

class ProctoringService {
  
  // Initialize proctoring session
  static async startProctoringSession(assignmentId: string, candidateId: string): Promise<ProctoringSession> {
    const sessionId = `proctoring_${assignmentId}_${candidateId}_${Date.now()}`;
    
    const session: ProctoringSession = {
      id: sessionId,
      assignmentId,
      candidateId,
      startTime: new Date(),
      status: 'active',
      violations: [],
      webcamEnabled: true,
      screenShareDetection: true,
      browserLockdown: true
    };
    
    activeSessions.set(sessionId, session);
    
    // Log session start
    console.log(`Proctoring session started: ${sessionId} for candidate ${candidateId}`);
    
    return session;
  }
  
  // End proctoring session
  static async endProctoringSession(sessionId: string): Promise<void> {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.status = 'completed';
      
      // Save session to database (implement storage method)
      await this.saveProctoringSession(session);
      
      // Clean up
      activeSessions.delete(sessionId);
      wsConnections.delete(sessionId);
      
      console.log(`Proctoring session ended: ${sessionId}`);
    }
  }
  
  // Analyze webcam frame using Gemini Vision
  static async analyzeWebcamFrame(sessionId: string, imageBase64: string): Promise<{ violations: ProctoringEvent[], analysis: string }> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Invalid proctoring session');
    }
    
    try {
      const prompt = `Analyze this webcam frame from an online assessment for proctoring purposes. 
      Look for:
      1. Number of faces visible (should be exactly 1)
      2. Eye gaze direction (should be looking at screen)
      3. Suspicious objects (phones, books, other people)
      4. Suspicious behaviors (looking away frequently, talking, writing notes)
      5. Lighting conditions and image quality
      
      Respond with JSON in this format:
      {
        "faceCount": number,
        "gazeDirection": "screen" | "away" | "unclear",
        "suspiciousObjects": string[],
        "suspiciousBehavior": boolean,
        "behaviorDescription": string,
        "riskLevel": "low" | "medium" | "high" | "critical",
        "recommendations": string[]
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: "image/jpeg"
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              faceCount: { type: "number" },
              gazeDirection: { type: "string" },
              suspiciousObjects: { type: "array", items: { type: "string" } },
              suspiciousBehavior: { type: "boolean" },
              behaviorDescription: { type: "string" },
              riskLevel: { type: "string" },
              recommendations: { type: "array", items: { type: "string" } }
            },
            required: ["faceCount", "gazeDirection", "riskLevel"]
          }
        }
      });
      
      const analysis = JSON.parse(response.text || "{}");
      const violations: ProctoringEvent[] = [];
      
      // Generate violation events based on analysis
      if (analysis.faceCount === 0) {
        violations.push({
          assignmentId: session.assignmentId,
          candidateId: session.candidateId,
          eventType: 'no_face',
          severity: 'high',
          description: 'No face detected in webcam frame',
          timestamp: new Date(),
          evidence: imageBase64,
          aiAnalysis: JSON.stringify(analysis),
          resolved: false
        });
      } else if (analysis.faceCount > 1) {
        violations.push({
          assignmentId: session.assignmentId,
          candidateId: session.candidateId,
          eventType: 'multiple_faces',
          severity: 'critical',
          description: `Multiple faces detected: ${analysis.faceCount}`,
          timestamp: new Date(),
          evidence: imageBase64,
          aiAnalysis: JSON.stringify(analysis),
          resolved: false
        });
      }
      
      if (analysis.suspiciousBehavior) {
        violations.push({
          assignmentId: session.assignmentId,
          candidateId: session.candidateId,
          eventType: 'suspicious_behavior',
          severity: analysis.riskLevel as 'low' | 'medium' | 'high' | 'critical',
          description: analysis.behaviorDescription || 'Suspicious behavior detected',
          timestamp: new Date(),
          evidence: imageBase64,
          aiAnalysis: JSON.stringify(analysis),
          resolved: false
        });
      }
      
      // Add violations to session
      session.violations.push(...violations);
      
      return { violations, analysis: JSON.stringify(analysis) };
      
    } catch (error) {
      console.error('Error analyzing webcam frame:', error);
      throw new Error('Failed to analyze webcam frame');
    }
  }
  
  // Report browser/window events
  static async reportBrowserEvent(sessionId: string, eventType: 'tab_switch' | 'window_blur' | 'screen_share', details: string): Promise<void> {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    const violation: ProctoringEvent = {
      assignmentId: session.assignmentId,
      candidateId: session.candidateId,
      eventType,
      severity: eventType === 'screen_share' ? 'critical' : 'medium',
      description: `Browser event: ${eventType} - ${details}`,
      timestamp: new Date(),
      resolved: false
    };
    
    session.violations.push(violation);
    
    // Notify proctors via WebSocket
    await this.notifyProctors(session, violation);
  }
  
  // Plagiarism detection for code submissions
  static async detectPlagiarism(code: string, language: string, questionId: string): Promise<{ isPlagiarized: boolean, confidence: number, sources?: string[] }> {
    try {
      const prompt = `Analyze this ${language} code for potential plagiarism indicators:
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Look for:
      1. Common patterns that suggest copied code
      2. Unusual variable naming patterns
      3. Code style inconsistencies
      4. Overly complex solutions for the problem level
      5. Comments or strings in different languages
      
      Respond with JSON:
      {
        "plagiarismScore": number (0-100),
        "confidence": number (0-1),
        "indicators": string[],
        "recommendation": "clean" | "suspicious" | "likely_plagiarized"
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              plagiarismScore: { type: "number" },
              confidence: { type: "number" },
              indicators: { type: "array", items: { type: "string" } },
              recommendation: { type: "string" }
            },
            required: ["plagiarismScore", "confidence", "recommendation"]
          }
        },
        contents: prompt
      });
      
      const result = JSON.parse(response.text || "{}");
      
      return {
        isPlagiarized: result.plagiarismScore > 70,
        confidence: result.confidence,
        sources: result.indicators
      };
      
    } catch (error) {
      console.error('Error detecting plagiarism:', error);
      return { isPlagiarized: false, confidence: 0 };
    }
  }
  
  // Get session status
  static getSession(sessionId: string): ProctoringSession | undefined {
    return activeSessions.get(sessionId);
  }
  
  // Get all violations for a session
  static getViolations(sessionId: string): ProctoringEvent[] {
    const session = activeSessions.get(sessionId);
    return session ? session.violations : [];
  }
  
  // Notify proctors about violations
  private static async notifyProctors(session: ProctoringSession, violation: ProctoringEvent): Promise<void> {
    // Send real-time notification to proctors
    // This would integrate with your notification system
    console.log(`🚨 PROCTORING ALERT: ${violation.eventType} - ${violation.description}`);
    
    // You could implement email alerts, dashboard notifications, etc.
  }
  
  // Save session to database (implement based on your schema)
  private static async saveProctoringSession(session: ProctoringSession): Promise<void> {
    // Implement database storage for proctoring sessions
    // This should integrate with your existing database schema
    console.log(`Saving proctoring session: ${session.id} with ${session.violations.length} violations`);
  }
  
  // Setup WebSocket for real-time communication
  static setupWebSocketConnection(sessionId: string, ws: WebSocket): void {
    wsConnections.set(sessionId, ws);
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'webcam_frame') {
          const result = await this.analyzeWebcamFrame(sessionId, message.imageData);
          
          ws.send(JSON.stringify({
            type: 'analysis_result',
            violations: result.violations,
            analysis: result.analysis
          }));
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      wsConnections.delete(sessionId);
    });
  }
}

// Export types and service
export { ProctoringService };
export default ProctoringService;