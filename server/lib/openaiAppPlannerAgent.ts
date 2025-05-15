import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-3.5-turbo-0125";

export async function planAppFiles(refinedPrompt: string, framework = "React", styling = "Tailwind CSS", stateManagement = "React Hooks", buildTool = "Vite"): Promise<any> {
  // Use openaiCodegen.txt as the system prompt
  const promptPath = path.join(__dirname, "../prompts/openaiCodegen.txt");
  const template = await fs.readFile(promptPath, "utf-8");
  const systemPrompt = template
    .replace(/{{framework}}/g, framework)
    .replace(/{{styling}}/g, styling)
    .replace(/{{stateManagement}}/g, stateManagement)
    .replace(/{{buildTool}}/g, buildTool);
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: refinedPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 4000,
  });
  const appJson = response.choices[0].message.content;
  if (!appJson) throw new Error("OpenAI did not return an app JSON");
  const parsed = JSON.parse(appJson);
  if (!parsed.files || !Array.isArray(parsed.files)) {
    throw new Error("Invalid response structure: missing files array");
  }
  // Return the full app JSON (files, dependencies, devDependencies)
  return parsed;
} 