import OpenAI from "openai";
import { FileNode } from "@shared/schema";
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-3.5-turbo-0125";

// Helper: Extract error messages from a failed live preview or stack trace
function extractErrorMessages(errorOutput: string): string[] {
  // Simple heuristic: split by lines, filter for lines with 'Error', 'Exception', or stack traces
  return errorOutput
    .split('\n')
    .filter(line => /error|exception|at |failed|undefined|cannot|unexpected|syntax/i.test(line))
    .map(line => line.trim())
    .filter(Boolean);
}

function interpolatePrompt(template: string, vars: Record<string, string>) {
  return template.replace(/{{(\w+)}}/g, (_, key) => vars[key] || '');
}

export async function fixAppErrors(
  errors: string[],
  files: FileNode[],
  framework: "React" | "Vue" | "Angular" = "React",
  livePreviewError?: string
): Promise<{
  success: boolean;
  files?: FileNode[];
  error?: string;
  debugInfo?: any;
}> {
  try {
    // If livePreviewError is provided, extract error messages and merge with errors
    let allErrors = [...errors];
    if (livePreviewError) {
      allErrors = [
        ...allErrors,
        ...extractErrorMessages(livePreviewError)
      ];
    }
    // Remove duplicates
    allErrors = Array.from(new Set(allErrors));

    const promptPath = path.join(__dirname, '../prompts/openaiErrorFix.txt');
    const template = await fs.readFile(promptPath, 'utf-8');
    const errorsStr = allErrors.length
      ? allErrors.map((error, i) => `${i + 1}. ${error}`).join('\n')
      : 'No explicit error messages, but the app is not working as expected.';
    const filesStr = files.filter(f => f.type === "file" && f.content)
      .map(file => `--- File: ${file.path} ---\n${file.content}\n`).join('\n');
    const systemPrompt = interpolatePrompt(template, { framework, errors: errorsStr, files: filesStr });

    // Try up to 2 times if the first fix fails to parse or doesn't fix the error
    let lastError = null;
    let fixedResponse = null;
    let debugInfo = [];
    let fixedFiles = files;
    for (let attempt = 1; attempt <= 2; attempt++) {
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
      debugInfo.push({ attempt, responseContent });
      try {
        fixedResponse = JSON.parse(responseContent || "");
        if (fixedResponse && fixedResponse.files && Array.isArray(fixedResponse.files)) {
          // Optionally, run a simple check for obvious errors in the fixed files
          // (e.g., missing imports, syntax errors, etc.)
          fixedFiles = fixedResponse.files;
          break;
        }
      } catch (err: any) {
        lastError = `Failed to parse OpenAI response: ${err.message}`;
      }
    }
    if (!fixedResponse || !fixedResponse.files || !Array.isArray(fixedResponse.files)) {
      return {
        success: false,
        error: lastError || "Invalid response structure: missing or invalid files array",
        files: files,
        debugInfo,
      };
    }
    return {
      success: true,
      files: fixedFiles,
      debugInfo,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to fix application: ${error.message || "Unknown error"}`,
      files: files,
      debugInfo: error,
    };
  }
} 