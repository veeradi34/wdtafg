import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { 
  ProjectSettings, 
  GeneratedApp, 
  FileNode,
  FrameworkType,
  StylingType,
  StateManagementType,
  BuildToolType
} from "@/lib/types";

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
      const response = await apiRequest("POST", "/api/generate", {
        prompt,
        framework: settings.framework,
        styling: settings.styling,
        stateManagement: settings.stateManagement,
        buildTool: settings.buildTool
      });

      const data = await response.json();
      setGeneratedApp(data);
      setIsComplete(true);
      options?.onSuccess?.(data);
    } catch (error) {
      console.error("Error generating app:", error);
      setError(error.message || "Failed to generate application");
      options?.onError?.(error);
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

  return {
    generateApp,
    reset,
    isGenerating,
    isComplete,
    setIsComplete,  // Export the setter
    error,
    generatedApp
  };
}
