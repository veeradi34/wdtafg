import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { 
  ProjectSettings, 
  FileNode,
  FrameworkType,
  StylingType,
  StateManagementType,
  BuildToolType
} from "@/lib/types";
import { GeneratedApp, CreativityMetrics } from "@shared/schema";

interface UseAppGenerationOptions {
  onSuccess?: (data: GeneratedApp) => void;
  onError?: (error: Error) => void;
}

export function useAppGeneration(options?: UseAppGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);

  const generateApp = async (
    prompt: string,
    settings: ProjectSettings
  ) => {
    if (!prompt.trim()) {
      setError("Prompt cannot be empty");
      return;
    }

    setIsGenerating(true);
    setIsComplete(false);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/generate-files-openai", {
        refinedPrompt: prompt,
        design_notes: "Generated from user prompt",
        framework: settings.framework,
        styling: settings.styling,
        stateManagement: settings.stateManagement,
        buildTool: settings.buildTool
      });

      const data = await response.json();
      setGeneratedApp(data);
      setIsComplete(true);
      options?.onSuccess?.(data);
    } catch (err) {
      console.error("Error generating app:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Failed to generate application");
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setIsGenerating(false);
    setIsComplete(false);
    setError(null);
    setGeneratedApp(null);
  };
  
  // Special function to handle demo app loading (skips API call)
  const loadDemoApp = (demoApp: GeneratedApp) => {
    setIsGenerating(true);
    setError(null);
    
    // Add sample creativity metrics for demo apps
    if (!demoApp.creativityMetrics) {
      demoApp.creativityMetrics = {
        score: 82,
        novelty: 78,
        usefulness: 85,
        elegance: 80,
        robustness: 84,
        description: "This demo app showcases good structure and practical implementation with clean, efficient code."
      };
    }
    
    // Simulate API call with a short delay
    setTimeout(() => {
      setGeneratedApp(demoApp);
      setIsComplete(true);
      setIsGenerating(false);
      
      if (options?.onSuccess) {
        options.onSuccess(demoApp);
      }
    }, 500);
  };

  return {
    generateApp,
    reset,
    loadDemoApp,
    isGenerating,
    isComplete,
    setIsComplete, // Export the setter
    error,
    generatedApp
  };
}
