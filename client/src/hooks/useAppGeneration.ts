// client/src/hooks/useAppGeneration.ts
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

// MongoDB integration
async function saveToMongoDB(
  prompt: string, 
  generatedApp: GeneratedApp, 
  settings: ProjectSettings
): Promise<string | null> {
  try {
    // Create a name from the first 30 chars of the prompt
    const projectName = prompt.length > 30 
      ? prompt.substring(0, 30) + "..." 
      : prompt;
    
    const response = await apiRequest("POST", "/api/mongo/projects", {
      name: projectName,
      prompt,
      generatedApp,
      settings
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save project: ${response.statusText}`);
    }
    
    const savedProject = await response.json();
    return savedProject._id;
  } catch (error) {
    console.error("Error saving to MongoDB:", error);
    return null;
  }
}

async function loadFromMongoDB(id: string): Promise<GeneratedApp | null> {
  try {
    const response = await apiRequest("GET", `/api/mongo/projects/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load project: ${response.statusText}`);
    }
    
    const project = await response.json();
    return project.generatedApp;
  } catch (error) {
    console.error(`Error loading project ${id}:`, error);
    return null;
  }
}

export function useAppGeneration(options?: UseAppGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

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
      // First check if we have a cached version in MongoDB
      try {
        const cachedResponse = await apiRequest("POST", "/api/mongo/generate", {
          prompt,
          settings
        });
        
        // If we get a 200 response, we have a cached version
        if (cachedResponse.ok) {
          const cachedData = await cachedResponse.json();
          setGeneratedApp(cachedData);
          setIsComplete(true);
          
          // Save the project reference and continue
          const savedId = await saveToMongoDB(prompt, cachedData, settings);
          if (savedId) setProjectId(savedId);
          
          options?.onSuccess?.(cachedData);
          setIsGenerating(false);
          return;
        }
      } catch (cacheError) {
        // Continue with normal generation if cache check fails
        console.warn("Cache check failed, continuing with normal generation:", cacheError);
      }

      // Normal generation path
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
      
      // Save to MongoDB in the background
      const savedId = await saveToMongoDB(prompt, data, settings);
      if (savedId) setProjectId(savedId);
      
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

  // Function to load a project from MongoDB
  const loadProject = async (id: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const loadedApp = await loadFromMongoDB(id);
      
      if (!loadedApp) {
        throw new Error(`Project ${id} not found or could not be loaded`);
      }
      
      setGeneratedApp(loadedApp);
      setProjectId(id);
      setIsComplete(true);
      options?.onSuccess?.(loadedApp);
    } catch (err) {
      console.error("Error loading project:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Failed to load project");
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
    setProjectId(null);
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
    loadProject, // New function to load a project from MongoDB
    reset,
    loadDemoApp,
    isGenerating,
    isComplete,
    setIsComplete, // Export the setter
    error,
    generatedApp,
    projectId // New state to track the MongoDB project ID
  };
}