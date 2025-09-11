import React from 'react';
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import AIGenerator from "@/components/question/ai-generator";

export default function AIGeneratorPage() {
  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      // Return some sample skills for the AI generator
      return [
        { id: "python", name: "Python" },
        { id: "javascript", name: "JavaScript" },
        { id: "react", name: "React" },
        { id: "nodejs", name: "Node.js" },
        { id: "sql", name: "SQL" },
        { id: "algorithms", name: "Algorithms" },
        { id: "data-structures", name: "Data Structures" }
      ];
    }
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Question Generator</h1>
          <p className="text-muted-foreground mt-2">
            Use artificial intelligence to generate high-quality assessment questions automatically.
            Select a skill, topic, and difficulty level to create questions tailored to your needs.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <AIGenerator
            skills={skills}
            onGenerated={() => {
              // Refresh or navigate after generation if needed
              console.log("Questions generated successfully");
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
}