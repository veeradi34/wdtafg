process.env.GOOGLE_API_KEY = 'AIzaSyDNo-6CNPVKHYYHNnts3tx7sOfiRNorm1w';
process.env.OPENAI_API_KEY = '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';

import { describe, it, expect, beforeAll } from 'vitest';
import * as openaiCodegenAgent from '../lib/openaiCodegenAgent';
import type { GenerateAppOptions } from '../lib/openaiCodegenAgent';
import * as geminiPromptRefiner from '../lib/geminiPromptRefiner';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

describe('generateApp (real OpenAI API, with Gemini refined prompt)', () => {
  let systemPrompt: string;
  beforeAll(async () => {
    const promptPath = path.join(__dirname, '../prompts/openaiCodegen.txt');
    systemPrompt = await fs.readFile(promptPath, 'utf-8');
  });

  it('gets a refined prompt from Gemini and generates an app with OpenAI', async () => {
    const userPrompt = 'Build a simple todo app with React, Tailwind CSS, and local state.';
    // Get refined prompt from Gemini
    const refined = await geminiPromptRefiner.refinePromptForOpenAI(userPrompt);
    console.log('Gemini Refined Prompt:', refined);
    const config: GenerateAppOptions = {
      prompt: refined.improvedPrompt,
      framework: 'React',
      styling: 'Tailwind CSS',
      stateManagement: 'React Hooks',
      buildTool: 'Vite',
    };
    const result = await openaiCodegenAgent.generateApp(config);
    console.log('Real OpenAI Codegen Result:', result);
    expect(Array.isArray(result.files)).toBe(true);
    expect(typeof result.dependencies).toBe('object');
    expect(typeof result.devDependencies).toBe('object');
    expect(result.files.length).toBeGreaterThan(0);
  }, 40000); // 40 seconds timeout
}); 