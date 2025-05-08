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

    // Build a comprehensive system prompt for high-quality UI/UX generation
    const systemPrompt = `As an elite ${framework} developer and UI/UX expert, create a polished, production-ready web app based on this description.
Use ${styling} for styling with a professional, modern aesthetic, ${stateManagement} for state management, and ${buildTool} as the build tool.

DESIGN REQUIREMENTS:
- Create a visually stunning, professional UI with careful attention to spacing, alignment, and typography
- Use a cohesive color scheme with proper contrast ratios for accessibility (WCAG AA compliant)
- Implement responsive layouts that look great on all device sizes
- Include polished micro-interactions, transitions, and loading states
- Design clean, intuitive navigation and user flows
- Use industry best practices for form design and validation
- Implement proper error handling with user-friendly error messages

CODE REQUIREMENTS:
- Write clean, maintainable, well-structured code
- Use proper component composition and reusable components
- Implement proper state management with ${stateManagement}
- Ensure responsive behavior works correctly on all screen sizes
- Include loading states and error handling
- Use semantic HTML and proper accessibility attributes
- Add comments for complex logic

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
    let jsonText = jsonMatch[1] || text;
    
    // Clean up the JSON text to handle common issues
    jsonText = jsonText.trim()
      // Fix cases where single quotes are used instead of double quotes
      .replace(/'/g, '"')
      // Fix trailing commas in objects/arrays which are invalid in JSON
      .replace(/,(\s*[\]}])/g, '$1')
      // Fix missing commas between properties
      .replace(/}(\s*){/g, '},{')
      // Replace any "undefined" with null
      .replace(/"undefined"/g, 'null')
      // Make sure strings are properly quoted
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
      // Fix cases where there are unquoted property values
      .replace(/:\s*([a-zA-Z0-9_]+)(\s*[,}])/g, ':"$1"$2');
    
    try {
      // First, try to parse the cleaned JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonText);
      } catch (initialParseError: any) {
        console.warn("Initial JSON parsing failed, attempting to fix:", initialParseError.message);
        
        // If that fails, try a more aggressive attempt to extract valid JSON
        // Look for something that looks like the start of our expected JSON structure
        const potentialJsonStart = jsonText.indexOf('{"files":');
        if (potentialJsonStart >= 0) {
          jsonText = jsonText.substring(potentialJsonStart);
          
          // Try to find a valid closing bracket
          let bracketCount = 0;
          let validEndIndex = jsonText.length;
          
          for (let i = 0; i < jsonText.length; i++) {
            if (jsonText[i] === '{') bracketCount++;
            if (jsonText[i] === '}') {
              bracketCount--;
              if (bracketCount === 0) {
                validEndIndex = i + 1;
                break;
              }
            }
          }
          
          jsonText = jsonText.substring(0, validEndIndex);
          
          // Try parsing again
          try {
            parsedResponse = JSON.parse(jsonText);
          } catch (secondParseError: any) {
            // If we still can't parse it, throw the original error
            throw initialParseError;
          }
        } else {
          // If we can't find the start of a JSON structure, throw the original error
          throw initialParseError;
        }
      }
      
      // Handle the case where the response is still not a valid format
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        throw new Error("Invalid response format: expected an object");
      }
      
      // Validate and sanitize the response
      if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
        // Create a minimal valid structure if files are missing
        parsedResponse.files = [
          {
            name: "index.html",
            path: "/index.html",
            type: "file",
            content: "<html><body><h1>Generation Error</h1><p>The API returned an incomplete response. Please try again.</p></body></html>",
            language: "html"
          }
        ];
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

// Function to fix errors in generated code using Gemini
export async function fixAppErrors(errors: string[], files: FileNode[], framework: FrameworkType = "React"): Promise<{ 
  success: boolean; 
  files?: FileNode[]; 
  error?: string 
}> {
  try {
    // Get the Gemini model
    const model = geminiAPI.getGenerativeModel({ model: MODEL });

    // Build a comprehensive prompt that explains the errors and provides the files
    let prompt = `You are an expert ${framework} developer and UI/UX specialist. The following web application has errors and needs optimization:

ERRORS DETECTED:
${errors.map((error, i) => `${i+1}. ${error}`).join('\n')}

FILES WITH POTENTIAL ISSUES:
`;

    // Add the files content to the prompt
    const relevantFiles = files.filter(f => f.type === "file" && f.content);
    relevantFiles.forEach(file => {
      prompt += `\n--- File: ${file.path} ---\n${file.content}\n`;
    });

    prompt += `
INSTRUCTIONS:
1. Analyze the errors and find their root causes.
2. Fix all technical errors in the affected files.
3. Additionally, enhance the UI/UX by:
   - Improving visual aesthetics with better spacing, typography, and color usage
   - Adding appropriate transitions and loading states
   - Enhancing component structure and reusability
   - Ensuring responsive design works properly
   - Improving accessibility
   - Making the interface more intuitive and user-friendly

4. Return ONLY the fixed and enhanced files as a JSON object in exactly this format:
{
  "files": [
    {
      "path": "file_path",
      "content": "fixed_file_content",
      "type": "file",
      "name": "filename"
    }
  ]
}

Do not include any explanations, markdown formatting, or text outside of this JSON structure.
Fix all errors while also significantly improving the visual design and user experience.
`;

    // Add retry logic for rate limit handling
    let retries = 0;
    const maxRetries = 3;
    let result;
    
    while (retries < maxRetries) {
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
          }
        });
        break; // If successful, exit the retry loop
      } catch (err: any) {
        // Check if it's a rate limit error (429)
        if (err.message && err.message.includes('429') && retries < maxRetries - 1) {
          retries++;
          console.log(`Rate limit hit when fixing errors, retrying (${retries}/${maxRetries})...`);
          
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
      throw new Error("Failed to fix errors after multiple attempts");
    }

    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
    let jsonText = jsonMatch[1] || text;
    
    // Clean up the JSON text to handle common issues - same as in generateApp
    jsonText = jsonText.trim()
      .replace(/'/g, '"')
      .replace(/,(\s*[\]}])/g, '$1')
      .replace(/}(\s*){/g, '},{')
      .replace(/"undefined"/g, 'null')
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
      .replace(/:\s*([a-zA-Z0-9_]+)(\s*[,}])/g, ':"$1"$2');
      
    try {
      // First, try to parse the cleaned JSON
      let fixedResponse;
      try {
        fixedResponse = JSON.parse(jsonText);
      } catch (initialParseError: any) {
        console.warn("Initial JSON parsing failed in fix app, attempting to fix:", initialParseError.message);
        
        // If that fails, try a more aggressive approach
        const potentialJsonStart = jsonText.indexOf('{"files":');
        if (potentialJsonStart >= 0) {
          jsonText = jsonText.substring(potentialJsonStart);
          
          // Try to find a valid closing bracket
          let bracketCount = 0;
          let validEndIndex = jsonText.length;
          
          for (let i = 0; i < jsonText.length; i++) {
            if (jsonText[i] === '{') bracketCount++;
            if (jsonText[i] === '}') {
              bracketCount--;
              if (bracketCount === 0) {
                validEndIndex = i + 1;
                break;
              }
            }
          }
          
          jsonText = jsonText.substring(0, validEndIndex);
          
          // Try parsing again
          try {
            fixedResponse = JSON.parse(jsonText);
          } catch (secondParseError: any) {
            // If we still can't parse it, throw the original error
            throw initialParseError;
          }
        } else {
          // If we can't find the start of a JSON structure, throw the original error
          throw initialParseError;
        }
      }
      
      // Validate the response structure
      if (!fixedResponse || !fixedResponse.files || !Array.isArray(fixedResponse.files)) {
        throw new Error("Invalid response structure: missing or invalid files array");
      }
      
      console.log(`Successfully fixed ${fixedResponse.files.length} files`);
      
      // Return the fixed files
      return {
        success: true,
        files: fixedResponse.files
      };
    } catch (parseError: any) {
      console.error("Error parsing Gemini fix response:", parseError, "Response was:", text.substring(0, 200) + "...");
      return {
        success: false,
        error: `Failed to parse Gemini response: ${parseError.message}`,
        files: files // Return the original files
      };
    }
  } catch (error: any) {
    console.error("Error fixing application with Gemini:", error);
    return {
      success: false,
      error: `Failed to fix application: ${error.message || "Unknown error"}`,
      files: files // Return the original files
    };
  }
}