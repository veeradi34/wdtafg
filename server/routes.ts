import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// import { generateApp, testGeminiAPI, analyzeCodeCreativity, refinePromptWithGemini } from "./lib/gemini";
// import { generateFilesFromPlan } from "./lib/openai";
import { insertProjectSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { planAppFiles } from "./lib/openaiAppPlannerAgent";
import { generateFileCode } from "./lib/openaiFileCodegenAgent";
import { fixAppErrors } from "./lib/openaiErrorFixAgent";
import OpenAI from "openai";
import { handleChatbotEdit } from "./lib/chatbotAgent";
import { getAppIdeaFeedback, getUpdateFeedback } from "./lib/conversationalBotAgent";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = app.use("/api", (req, res, next) => {
    next();
  });

  // Test route for checking basic API functionality
  app.get("/api/test", (req: Request, res: Response) => {
    res.json({ message: "API is working" });
  });

  // Test the Gemini API integration
  // app.get("/api/test-gemini", async (req: Request, res: Response) => {
  //   try {
  //     const result = await testGeminiAPI();
  //     res.json({ result });
  //   } catch (error: any) {
  //     res.status(500).json({ error: error.message || "Unknown error" });
  //   }
  // });

  // Generate app from prompt
  // app.post("/api/generate", async (req: Request, res: Response) => {
  //   try {
  //     const { prompt, framework, styling, stateManagement, buildTool } = req.body;
  //     if (!prompt) {
  //       return res.status(400).json({ error: "Prompt is required" });
  //     }
  //     const appConfig = {
  //       prompt,
  //       framework: framework || "React",
  //       styling: styling || "Tailwind CSS",
  //       stateManagement: stateManagement || "React Hooks",
  //       buildTool: buildTool || "Vite",
  //     };
  //     // Generate the app
  //     const generatedApp = await generateApp(appConfig);
  //     try {
  //       // Analyze code creativity in the background
  //       setTimeout(async () => {
  //         try {
  //           const creativityMetrics = await analyzeCodeCreativity(generatedApp.files);
  //           generatedApp.creativityMetrics = creativityMetrics;
  //           console.log("Code creativity analysis completed:", creativityMetrics.score);
  //         } catch (analysisError) {
  //           console.error("Error in background creativity analysis:", analysisError);
  //         }
  //       }, 100);
  //       res.json(generatedApp);
  //     } catch (analysisError) {
  //       console.warn("Error analyzing code creativity:", analysisError);
  //       res.json(generatedApp);
  //     }
  //   } catch (error: any) {
  //     console.error("Error generating app:", error);
  //     res.status(500).json({ error: error.message || "Unknown error" });
  //   }
  // });

  // Project CRUD endpoints
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: validationError.message });
      }

      const project = await storage.createProject(result.data);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.put("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const updatedProject = await storage.updateProject(id, req.body);
      res.json(updatedProject);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const result = await storage.deleteProject(id);
      if (!result) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
  
  // Error fixing endpoint - uses Gemini to fix code errors
  app.post("/api/fix-errors", async (req: Request, res: Response) => {
    try {
      const { errors, files, framework } = req.body;
      if (!errors || !errors.length || !files || !files.length) {
        return res.status(400).json({ 
          error: "Errors and files are required",
          success: false 
        });
      }
      console.log(`Attempting to fix ${errors.length} errors in ${files.length} files`);
      // TODO: Update this to use the new Gemini error fix agent if available
      // const { fixAppErrors } = await import("./lib/gemini");
      // const result = await fixAppErrors(errors, files, framework || "React");
      // if (result.success) {
      //   res.json({
      //     success: true,
      //     message: "Code fixed successfully",
      //     files: result.files
      //   });
      // } else {
      //   res.status(500).json({
      //     success: false,
      //     error: result.error || "Unknown error fixing code",
      //     files: files // Return original files if fixing failed
      //   });
      // }
      res.status(501).json({ error: "Not implemented: Gemini error fix agent refactor required." });
    } catch (error: any) {
      console.error("Error fixing code:", error);
      res.status(500).json({ 
        error: error.message || "Unknown error",
        success: false
      });
    }
  });

  // Refine prompt using Gemini
  // app.post("/api/refine-prompt", async (req: Request, res: Response) => {
  //   try {
  //     const { prompt } = req.body;
  //     if (!prompt) {
  //       return res.status(400).json({ error: "Prompt is required" });
  //     }
  //     const result = await refinePromptWithGemini(prompt);
  //     res.json(result);
  //   } catch (error: any) {
  //     console.error("Error refining prompt:", error);
  //     res.status(500).json({ error: error.message || "Unknown error" });
  //   }
  // });

  // Generate files using OpenAI from a refined plan (new modular workflow)
  app.post("/api/generate-files-openai", async (req: Request, res: Response) => {
    try {
      const { refinedPrompt, design_notes, framework, styling, stateManagement, buildTool } = req.body;
      if (!refinedPrompt || !design_notes) {
        return res.status(400).json({ error: "refinedPrompt and design_notes are required" });
      }
      // Step 1: Get the app plan (files, dependencies, etc.)
      const appJson = await planAppFiles(refinedPrompt, framework, styling, stateManagement, buildTool);
      
      // Step 1.5: Get conversational bot feedback (appreciation + breakdown)
      const conversationMessage = await getAppIdeaFeedback(refinedPrompt);
      
      // Step 2: Generate code for each file
      const generated_files = [];
      for (const file of appJson.files) {
        let errorContext = '';
        let result = {
          code: '',
          isStub: true,
          errorMsg: 'Codegen did not run.'
        };
        // Try up to 3 times to generate a valid file
        for (let attempt = 0; attempt < 3; attempt++) {
          result = await generateFileCode({
            refinedPrompt,
            design_notes,
            filePath: file.path,
            fileInfo: file.info || {},
            framework: framework || "React",
            styling: styling || "Tailwind CSS",
            errorContext,
            maxRetries: 0 // We handle retries here, so set to 0 in the agent
          });
          if (!result.isStub) break;
          errorContext = result.errorMsg || errorContext;
        }
        // Infer name, type, and language
        const name = file.path.split("/").pop() || file.path;
        const ext = name.split(".").pop() || "";
        let language = undefined;
        switch (ext) {
          case "js": language = "javascript"; break;
          case "jsx": language = "jsx"; break;
          case "ts": language = "typescript"; break;
          case "tsx": language = "tsx"; break;
          case "json": language = "json"; break;
          case "css": language = "css"; break;
          case "html": language = "html"; break;
          case "md": language = "markdown"; break;
          default: language = undefined;
        }
        generated_files.push({
          name,
          path: file.path,
          type: "file",
          content: result.code,
          language,
          isStub: result.isStub,
          errorMsg: result.errorMsg || ''
        });
      }
      res.json({
        generated_files,
        dependencies: appJson.dependencies || {},
        devDependencies: appJson.devDependencies || {},
        conversationMessage // <-- include the bot's message in the response
      });
    } catch (error: any) {
      console.error("Error generating files with OpenAI:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  // --- Chatbot Edit Agent Endpoint ---

  // Utility: Compute cosine similarity between two vectors
  function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }

  // Utility: Get embedding for a string
  async function getEmbedding(text: string): Promise<number[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return res.data[0].embedding;
  }

  app.post("/api/chatbot-edit", async (req, res) => {
    try {
      const { message, codeFiles, conversationHistory } = req.body;
      const result = await handleChatbotEdit({ message, codeFiles, conversationHistory });
      res.json(result);
    } catch (error: any) {
      console.error("Error in chatbot-edit:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  // Initial app idea feedback
  app.post("/api/conversation/initiate", async (req: Request, res: Response) => {
    try {
      const { refinedPrompt } = req.body;
      if (!refinedPrompt) {
        return res.status(400).json({ error: "refinedPrompt is required" });
      }
      const message = await getAppIdeaFeedback(refinedPrompt);
      res.json({ message });
    } catch (error: any) {
      console.error("Error in conversation/initiate:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  // Update feedback
  app.post("/api/conversation/update", async (req: Request, res: Response) => {
    try {
      const { updatePrompt, appStateSummary } = req.body;
      if (!updatePrompt || !appStateSummary) {
        return res.status(400).json({ error: "updatePrompt and appStateSummary are required" });
      }
      const message = await getUpdateFeedback(updatePrompt, appStateSummary);
      res.json({ message });
    } catch (error: any) {
      console.error("Error in conversation/update:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
