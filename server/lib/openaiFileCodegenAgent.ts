import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as babel from "@babel/core";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-3.5-turbo-0125";

export async function generateFileCode({
  refinedPrompt,
  design_notes,
  filePath,
  fileInfo,
  framework = "React",
  styling = "Tailwind CSS",
  errorContext = '',
  maxRetries = 2
}: {
  refinedPrompt: string;
  design_notes: string;
  filePath: string;
  fileInfo: any;
  framework?: string;
  styling?: string;
  errorContext?: string;
  maxRetries?: number;
}): Promise<{ code: string; isStub: boolean; errorMsg?: string }> {
  const promptPath = path.join(__dirname, "../prompts/openaiFileCodegen.txt");
  const filePromptTemplate = await fs.readFile(promptPath, "utf-8");
  let lastError = '';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let filePrompt = filePromptTemplate
      .replace(/{{framework}}/g, framework)
      .replace(/{{styling}}/g, styling)
      .replace(/{{refinedPrompt}}/g, refinedPrompt)
      .replace(/{{design_notes}}/g, design_notes)
      .replace(/{{path}}/g, filePath)
      .replace(/{{info}}/g, JSON.stringify(fileInfo, null, 2));
    if (errorContext && attempt > 0) {
      filePrompt += `\n\nPrevious error(s) when generating this file: ${errorContext}`;
    } else if (lastError && attempt > 0) {
      filePrompt += `\n\nPrevious error(s) when generating this file: ${lastError}`;
    }
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: filePrompt },
        { role: "user", content: "Generate the code for this file only." }
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });
    const code = response.choices[0].message.content?.trim() || "";
    // Server-side JSX validation using Babel
    let isValid = true;
    let errorMsg = '';
    try {
      babel.transformSync(code, { presets: ["@babel/preset-react"] });
      // Heuristic: check for truncated/incomplete code (e.g., last line ends with '<' or is cut off)
      const lines = code.split('\n');
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine.endsWith('<') || lastLine.endsWith('{') || lastLine.endsWith('(') || /<[^>]*$/.test(lastLine)) {
        isValid = false;
        errorMsg = 'Code appears truncated or incomplete.';
      }
    } catch (e) {
      const err = e as Error;
      isValid = false;
      errorMsg = err.message;
    }
    if (isValid) {
      return { code, isStub: false };
    } else {
      lastError = errorMsg;
    }
  }
  // All attempts failed, return a stub
  console.warn(`[Codegen] Invalid or incomplete code for ${filePath} after retries: ${lastError}`);
  const compName = path.basename(filePath, path.extname(filePath));
  return {
    code: `const ${compName} = () => null; window.${compName} = ${compName};`,
    isStub: true,
    errorMsg: lastError
  };
} 