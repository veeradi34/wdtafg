import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o";

export async function generateFileCode({
  refinedPrompt,
  design_notes,
  filePath,
  fileInfo,
  framework = "React",
  styling = "Tailwind CSS"
}: {
  refinedPrompt: string;
  design_notes: string;
  filePath: string;
  fileInfo: any;
  framework?: string;
  styling?: string;
}): Promise<string> {
  const promptPath = path.join(__dirname, "../prompts/openaiFileCodegen.txt");
  const filePromptTemplate = await fs.readFile(promptPath, "utf-8");
  const filePrompt = filePromptTemplate
    .replace(/{{framework}}/g, framework)
    .replace(/{{styling}}/g, styling)
    .replace(/{{refinedPrompt}}/g, refinedPrompt)
    .replace(/{{design_notes}}/g, design_notes)
    .replace(/{{path}}/g, filePath)
    .replace(/{{info}}/g, JSON.stringify(fileInfo, null, 2));
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: filePrompt },
      { role: "user", content: "Generate the code for this file only." }
    ],
    temperature: 0.4,
    max_tokens: 2000,
  });
  return response.choices[0].message.content?.trim() || "";
} 