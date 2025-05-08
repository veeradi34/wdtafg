import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { FileNode, GeneratedApp } from "@shared/schema";

// Initialize Google Generative AI with API key
const geminiAPI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Using a less resource-intensive model that has higher quota limits
// This will help avoid rate limiting issues on the free tier
const MODEL = "gemini-1.5-flash";

type FrameworkType = "React" | "Vue" | "Angular";
type StylingType = "Tailwind CSS" | "Material UI" | "Styled Components" | "CSS Modules";
type StateManagementType = "React Hooks" | "Redux" | "Zustand" | "Context API";
type BuildToolType = "Vite" | "Webpack" | "Create React App";

interface GenerateAppOptions {
  prompt: string;
  framework: FrameworkType;
  styling: StylingType;
  stateManagement: StateManagementType;
  buildTool: BuildToolType;
}

// Function to generate application code from a prompt
export async function generateApp({ 
  prompt,
  framework,
  styling,
  stateManagement,
  buildTool
}: GenerateAppOptions): Promise<GeneratedApp> {
  try {
    // Create a detailed system prompt
    const generativeModel = geminiAPI.getGenerativeModel({ model: MODEL });
    
    // Set safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // Build a simplified system prompt to reduce token usage and avoid rate limits
    const systemPrompt = `As an expert ${framework} developer, create a minimal but functional web app based on this description.
Use ${styling} for styling, ${stateManagement} for state management, and ${buildTool} as the build tool.
Output a valid JSON object with this structure:
{
  "files": [
    {
      "name": "filename.ext",
      "path": "/path/to/file",
      "content": "file content",
      "language": "js|tsx|css|html|json",
      "type": "file"
    },
    {
      "name": "directory",
      "path": "/path/to/directory",
      "type": "folder",
      "children": [ /* nested files/folders */ ]
    }
  ],
  "dependencies": { "package-name": "version" },
  "devDependencies": { "package-name": "version" }
}
Include only essential files needed for a working MVP.
`;

    // Generate content with system and user prompts - with shorter, more concise prompt
    const fullPrompt = systemPrompt + "\n\nUser Request: " + prompt + "\n\nProvide JSON response only:";
    
    // Add retry mechanism for rate limit handling
    let retries = 0;
    const maxRetries = 3;
    let result;
    
    while (retries < maxRetries) {
      try {
        result = await generativeModel.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
          },
          safetySettings
        });
        break; // If successful, exit the retry loop
      } catch (err: any) {
        // Check if it's a rate limit error (429)
        if (err.message && err.message.includes('429') && retries < maxRetries - 1) {
          retries++;
          console.log(`Rate limit hit, retrying (${retries}/${maxRetries})...`);
          
          // Wait with exponential backoff (1s, 2s, 4s, etc.)
          const delay = 1000 * Math.pow(2, retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors or if we've exhausted retries, rethrow
        throw err;
      }
    }
    
    if (!result) {
      throw new Error("Failed to generate content after multiple attempts");
    }

    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    // This handles cases where the model might add surrounding markdown or text
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
    const jsonText = jsonMatch[1] || text;
    
    try {
      const parsedResponse = JSON.parse(jsonText.trim());
      
      // Validate and sanitize the response
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
    } catch (parseError: any) {
      console.error("Error parsing Gemini response:", parseError);
      throw new Error(`Failed to parse Gemini response: ${parseError.message || "Unknown parsing error"}`);
    }
  } catch (error: any) {
    console.error("Error generating application:", error);
    throw new Error(`Failed to generate application: ${error.message || "Unknown error"}`);
  }
}

// Simple test to check if the Gemini integration is working
export async function testGeminiAPI(): Promise<string> {
  try {
    const model = geminiAPI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Add retry logic similar to generateApp
    let retries = 0;
    const maxRetries = 3;
    let result;
    
    while (retries < maxRetries) {
      try {
        result = await model.generateContent({
          contents: [{ 
            role: "user", 
            parts: [{ text: "Return a simple Hello World message as JSON with a property called 'message'." }] 
          }],
          generationConfig: {
            temperature: 0,
          }
        });
        break; // If successful, exit the retry loop
      } catch (err: any) {
        // Check if it's a rate limit error (429)
        if (err.message && err.message.includes('429') && retries < maxRetries - 1) {
          retries++;
          console.log(`Rate limit hit in test, retrying (${retries}/${maxRetries})...`);
          
          // Wait with exponential backoff (1s, 2s, 4s, etc.)
          const delay = 1000 * Math.pow(2, retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors or if we've exhausted retries, rethrow
        throw err;
      }
    }
    
    if (!result) {
      return 'Failed to test API after multiple attempts';
    }

    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API test failed:", error);
    return `Gemini API test failed: ${error.message || "Unknown error"}`;
  }
}