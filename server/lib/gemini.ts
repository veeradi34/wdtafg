import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { FileNode, GeneratedApp } from "@shared/schema";

// Initialize Google Generative AI with API key
const geminiAPI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// The latest Gemini model
const MODEL = "gemini-1.5-pro";

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

    // Build the system prompt
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

    // Generate content with system and user prompts
    const fullPrompt = systemPrompt + "\n\nUser Request: " + prompt + "\n\nPlease provide the JSON response as described above:";
    
    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
      safetySettings
    });

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
    
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: "Return a simple Hello World message as JSON with a property called 'message'." }] 
      }],
      generationConfig: {
        temperature: 0,
      }
    });

    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API test failed:", error);
    return `Gemini API test failed: ${error.message || "Unknown error"}`;
  }
}