// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

import { GoogleGenAI } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export interface GenerateQuestionsRequest {
  skill: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  questionType: "multiple_choice" | "coding" | "scenario";
  count: number;
  context?: string; // Additional context or uploaded document content
}

export interface GeneratedQuestion {
  title: string;
  description: string;
  content: any; // Question-specific content based on type
  correctAnswer?: any;
  explanation?: string;
  timeLimit?: number; // in minutes
}

export async function generateQuestions(request: GenerateQuestionsRequest): Promise<GeneratedQuestion[]> {
  try {
    let prompt = "";
    
    switch (request.questionType) {
      case "multiple_choice":
        prompt = `Generate ${request.count} multiple choice questions for ${request.skill}`;
        if (request.topic) prompt += ` focusing on ${request.topic}`;
        prompt += ` at ${request.difficulty} difficulty level.
        
        ${request.context ? `Use this context: ${request.context}` : ""}
        
        For each question, provide:
        1. A clear, concise title
        2. A detailed description/question text
        3. 4 answer options (A, B, C, D)
        4. The correct answer (letter)
        5. An explanation of why the answer is correct
        6. Estimated time limit in minutes
        
        Return as JSON array with this structure:
        {
          "questions": [
            {
              "title": "Question title",
              "description": "Question text",
              "content": {
                "options": ["A: option1", "B: option2", "C: option3", "D: option4"]
              },
              "correctAnswer": "A",
              "explanation": "Why this answer is correct",
              "timeLimit": 5
            }
          ]
        }`;
        break;

      case "coding":
        prompt = `Generate ${request.count} coding challenges for ${request.skill}`;
        if (request.topic) prompt += ` focusing on ${request.topic}`;
        prompt += ` at ${request.difficulty} difficulty level.
        
        ${request.context ? `Use this context: ${request.context}` : ""}
        
        For each question, provide:
        1. A clear, concise title
        2. A detailed problem description with requirements
        3. Input/output examples
        4. Constraints and edge cases
        5. Function signature or starter code
        6. Test cases for validation
        7. Expected solution approach
        8. Estimated time limit in minutes
        
        Return as JSON array with this structure:
        {
          "questions": [
            {
              "title": "Problem title",
              "description": "Problem description with examples",
              "content": {
                "starterCode": "function signature or template",
                "testCases": [
                  {"input": "example input", "expectedOutput": "expected result"},
                  {"input": "edge case", "expectedOutput": "expected result"}
                ],
                "constraints": "Time/space complexity, input limits",
                "language": "${request.skill.toLowerCase()}"
              },
              "correctAnswer": {
                "solutionCode": "sample solution",
                "approach": "explanation of solution approach"
              },
              "timeLimit": 30
            }
          ]
        }`;
        break;

      case "scenario":
        prompt = `Generate ${request.count} scenario-based questions for ${request.skill}`;
        if (request.topic) prompt += ` focusing on ${request.topic}`;
        prompt += ` at ${request.difficulty} difficulty level.
        
        ${request.context ? `Use this context: ${request.context}` : ""}
        
        For each question, provide:
        1. A realistic scenario title
        2. A detailed scenario description
        3. Specific tasks or decisions to be made
        4. Expected deliverables (files, configurations, etc.)
        5. Evaluation criteria
        6. Estimated time limit in minutes
        
        Return as JSON array with this structure:
        {
          "questions": [
            {
              "title": "Scenario title",
              "description": "Detailed scenario and requirements",
              "content": {
                "scenario": "Background situation",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "deliverables": ["Expected output 1", "Expected output 2"],
                "evaluationCriteria": ["Criteria 1", "Criteria 2"]
              },
              "correctAnswer": {
                "sampleSolution": "Example of correct approach",
                "keyPoints": ["Important aspect 1", "Important aspect 2"]
              },
              "timeLimit": 60
            }
          ]
        }`;
        break;
    }

    const systemPrompt = `You are an expert assessment creator specializing in technical skills evaluation. 
          Generate high-quality, professional questions that accurately assess the specified skill level. 
          Ensure questions are clear, unambiguous, and test practical knowledge.
          Always respond with valid JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user", 
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  content: { type: "object" },
                  correctAnswer: {},
                  explanation: { type: "string" },
                  timeLimit: { type: "number" }
                },
                required: ["title", "description", "content"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result.questions || [];

  } catch (error) {
    console.error("Error generating questions with AI:", error);
    throw new Error("Failed to generate questions: " + (error as Error).message);
  }
}

export async function improveQuestionQuality(question: any): Promise<any> {
  try {
    const prompt = `Review and improve this assessment question for clarity, accuracy, and educational value:

    Title: ${question.title}
    Description: ${question.description}
    Type: ${question.type}
    Difficulty: ${question.difficulty}
    Content: ${JSON.stringify(question.content)}

    Please provide an improved version that:
    1. Has clearer, more precise language
    2. Better tests the intended skill
    3. Has appropriate difficulty level
    4. Includes better examples or test cases if applicable
    5. Has more accurate scoring criteria

    Return the improved question in the same JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [{ text: `You are an expert in educational assessment and question quality improvement.\n\n${prompt}` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            type: { type: "string" },
            difficulty: { type: "string" },
            content: { type: "object" },
            correctAnswer: {},
            explanation: { type: "string" },
            timeLimit: { type: "number" }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");

  } catch (error) {
    console.error("Error improving question quality:", error);
    throw new Error("Failed to improve question: " + (error as Error).message);
  }
}

export async function generateQuestionFeedback(question: any, answer: any, isCorrect: boolean): Promise<string> {
  try {
    const prompt = `Generate constructive feedback for this assessment question and answer:

    Question: ${question.title}
    Description: ${question.description}
    Student Answer: ${JSON.stringify(answer)}
    Is Correct: ${isCorrect}
    Correct Answer: ${JSON.stringify(question.correctAnswer)}

    Provide helpful feedback that:
    1. Explains what the student did right or wrong
    2. Provides learning guidance
    3. Suggests improvement areas
    4. Is encouraging and constructive

    Return only the feedback text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [{ text: `You are a helpful tutor providing constructive feedback on assessment answers.\n\n${prompt}` }]
        }
      ]
    });

    return response.text || "Good effort! Keep practicing to improve your skills.";

  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Thank you for your response. Please review the correct answer and continue practicing.";
  }
}
