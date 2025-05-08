import OpenAI from "openai";
import { FileNode, GeneratedApp } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

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
    const systemPrompt = `You are an expert ${framework} developer who specializes in creating complete web applications.
Your task is to generate a complete web application based on the user's description.
Use ${styling} for styling, ${stateManagement} for state management, and ${buildTool} as the build tool.
You must output a valid JSON object with this structure:
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
Include all necessary files to make the application functional, including:
- Main application files
- Component files
- Style files
- Configuration files (package.json, etc.)
- Ensure proper imports, routing, and state management based on the technologies specified
`;

    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system",
          content: systemPrompt
        },
        { 
          role: "user",
          content: prompt 
        }
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
  } catch (error) {
    console.error("Error generating application:", error);
    throw new Error(`Failed to generate application: ${error.message}`);
  }
}

// Simple test to check if the OpenAI integration is working
export async function testOpenAI(): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "user",
          content: "Return a simple Hello World message as JSON with a property called 'message'."
        }
      ],
      response_format: { type: "json_object" },
    });

    return response.choices[0].message.content || "No response";
  } catch (error) {
    console.error("OpenAI test failed:", error);
    return `OpenAI test failed: ${error.message}`;
  }
}
