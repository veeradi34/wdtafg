import OpenAI from "openai";
import { FileNode } from "@shared/schema";
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o";

type FrameworkType = "React" | "Vue" | "Angular";

function interpolatePrompt(template: string, vars: Record<string, string>) {
  return template.replace(/{{(\w+)}}/g, (_, key) => vars[key] || '');
}

export async function fixAppErrors(errors: string[], files: FileNode[], framework: FrameworkType = "React"): Promise<{
  success: boolean;
  files?: FileNode[];
  error?: string;
}> {
  try {
    const promptPath = path.join(__dirname, '../prompts/openaiErrorFix.txt');
    const template = await fs.readFile(promptPath, 'utf-8');
    const errorsStr = errors.map((error, i) => `${i+1}. ${error}`).join('\n');
    const filesStr = files.filter(f => f.type === "file" && f.content)
      .map(file => `--- File: ${file.path} ---\n${file.content}\n`).join('\n');
    const systemPrompt = interpolatePrompt(template, { framework, errors: errorsStr, files: filesStr });
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please fix the above errors and return the fixed files as specified." }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 3000,
    });
    const responseContent = response.choices[0].message.content;
    let fixedResponse;
    try {
      fixedResponse = JSON.parse(responseContent || "");
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to parse OpenAI response: ${err.message}`,
        files: files
      };
    }
    if (!fixedResponse || !fixedResponse.files || !Array.isArray(fixedResponse.files)) {
      return {
        success: false,
        error: "Invalid response structure: missing or invalid files array",
        files: files
      };
    }
    return {
      success: true,
      files: fixedResponse.files
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to fix application: ${error.message || "Unknown error"}`,
      files: files
    };
  }
} 