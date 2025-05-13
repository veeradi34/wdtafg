import OpenAI from "openai";
import { FileNode, GeneratedApp } from "@shared/schema";
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o";

type FrameworkType = "React" | "Vue" | "Angular";
type StylingType = "Tailwind CSS" | "Material UI" | "Styled Components" | "CSS Modules";
type StateManagementType = "React Hooks" | "Redux" | "Zustand" | "Context API";
type BuildToolType = "Vite" | "Webpack" | "Create React App";

export type GenerateAppOptions = {
  prompt: string;
  framework: FrameworkType;
  styling: StylingType;
  stateManagement: StateManagementType;
  buildTool: BuildToolType;
};

function interpolatePrompt(template: string, vars: Record<string, string>) {
  return template.replace(/{{(\w+)}}/g, (_, key) => vars[key] || '');
}

export async function generateApp({ 
  prompt,
  framework,
  styling,
  stateManagement,
  buildTool
}: GenerateAppOptions): Promise<GeneratedApp> {
  try {
    const promptPath = path.join(__dirname, '../prompts/openaiCodegen.txt');
    const template = await fs.readFile(promptPath, 'utf-8');
    const systemPrompt = interpolatePrompt(template, { framework, styling, stateManagement, buildTool });
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }
    const parsedResponse = JSON.parse(responseContent);
    if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
      throw new Error("Invalid response structure: missing files array");
    }
    if (!parsedResponse.dependencies || typeof parsedResponse.dependencies !== 'object') {
      parsedResponse.dependencies = {};
    }
    if (!parsedResponse.devDependencies || typeof parsedResponse.devDependencies !== 'object') {
      parsedResponse.devDependencies = {};
    }
    return parsedResponse as GeneratedApp;
  } catch (error) {
    console.error("Error generating application:", error);
    throw new Error(`Failed to generate application: ${error.message}`);
  }
}

// NOTE: File plan and per-file codegen logic has been moved to openaiAppPlannerAgent.ts and openaiFileCodegenAgent.ts for modularity and best practices.

export async function generateFilesFromPlan({
  refinedPrompt,
  design_notes,
  file_plan,
  framework = "React",
  styling = "Tailwind CSS",
  stateManagement = "React Hooks",
  buildTool = "Vite"
}: {
  refinedPrompt: string;
  design_notes: string;
  file_plan: any;
  framework?: FrameworkType;
  styling?: StylingType;
  stateManagement?: StateManagementType;
  buildTool?: BuildToolType;
}): Promise<{ path: string; content: string }[]> {
  function flattenFilePlan(plan: any, parentPath = ""): { path: string; info: any }[] {
    if (!plan) return [];
    if (Array.isArray(plan)) {
      return plan.flatMap((item) => flattenFilePlan(item, parentPath));
    }
    if (plan.type === "file") {
      return [{ path: parentPath + '/' + plan.name, info: plan }];
    }
    if (plan.type === "folder" || plan.type === "directory") {
      const folderPath = parentPath + '/' + plan.name;
      return (plan.children || []).flatMap((child: any) => flattenFilePlan(child, folderPath));
    }
    if (typeof plan === 'object') {
      return Object.values(plan).flatMap((item: any) => flattenFilePlan(item, parentPath));
    }
    return [];
  }
  const filesToGenerate = flattenFilePlan(file_plan).filter(f => f.path && f.info);
  const generatedFiles: { path: string; content: string }[] = [];
  const filePromptPath = path.join(__dirname, '../prompts/openaiFileCodegen.txt');
  const filePromptTemplate = await fs.readFile(filePromptPath, 'utf-8');
  for (const { path: filePath, info } of filesToGenerate) {
    const filePrompt = interpolatePrompt(filePromptTemplate, {
      framework,
      styling,
      refinedPrompt,
      design_notes,
      path: filePath,
      info: JSON.stringify(info, null, 2)
    });
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: filePrompt },
        { role: "user", content: "Generate the code for this file only." }
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });
    const code = response.choices[0].message.content || "";
    generatedFiles.push({ path: filePath, content: code.trim() });
  }
  return generatedFiles;
} 