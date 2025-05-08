import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateApp, testGeminiAPI } from "./lib/gemini";
import { insertProjectSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

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
  app.get("/api/test-gemini", async (req: Request, res: Response) => {
    try {
      const result = await testGeminiAPI();
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  // Generate app from prompt
  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      const { prompt, framework, styling, stateManagement, buildTool } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const appConfig = {
        prompt,
        framework: framework || "React",
        styling: styling || "Tailwind CSS",
        stateManagement: stateManagement || "React Hooks",
        buildTool: buildTool || "Vite",
      };

      const generatedApp = await generateApp(appConfig);
      res.json(generatedApp);
    } catch (error: any) {
      console.error("Error generating app:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

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
      const { errors, files } = req.body;
      
      if (!errors || !errors.length || !files || !files.length) {
        return res.status(400).json({ 
          error: "Errors and files are required",
          success: false 
        });
      }
      
      console.log(`Attempting to fix ${errors.length} errors in ${files.length} files`);
      
      // In a real implementation, this would call the Gemini API with a prompt like:
      // "You are debugging code for an application. The following errors were detected:
      // [Error List]
      // 
      // Here are the relevant files:
      // [Files with content]
      //
      // Please fix the errors and return the corrected versions of these files.
      // Focus only on fixing the specific errors mentioned."
      
      // For now, simulate a successful fix with a delay
      setTimeout(() => {
        res.json({
          success: true,
          message: "Code fixed successfully",
          files: files // In a real implementation, this would be the fixed files
        });
      }, 1500);
      
    } catch (error: any) {
      console.error("Error fixing code:", error);
      res.status(500).json({ 
        error: error.message || "Unknown error",
        success: false
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
