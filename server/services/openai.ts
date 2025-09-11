import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert assessment creator specializing in technical skills evaluation. 
          Generate high-quality, professional questions that accurately assess the specified skill level. 
          Ensure questions are clear, unambiguous, and test practical knowledge.
          Always respond with valid JSON format.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
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

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert in educational assessment and question quality improvement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || "{}");

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

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a helpful tutor providing constructive feedback on assessment answers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Good effort! Keep practicing to improve your skills.";

  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Thank you for your response. Please review the correct answer and continue practicing.";
  }
}
