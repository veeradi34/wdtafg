import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { FileNode, GeneratedApp, CreativityMetrics } from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is required in environment variables');
}

// Initialize Google Generative AI with API key
const geminiAPI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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

    // Build a comprehensive system prompt for high-quality UI/UX generation with strict JSON output format
    const systemPrompt = `You are an expert ${framework} developer with UI/UX specialization. Your task is to create a production-ready web application based on a user's description.

TECHNICAL SPECIFICATIONS:
- Framework: ${framework}
- Styling: ${styling}
- State Management: ${stateManagement}
- Build Tool: ${buildTool}

DESIGN REQUIREMENTS:
- Professional UI with careful attention to spacing, alignment, and typography
- Cohesive color scheme with proper contrast ratios (WCAG AA compliant)
- Responsive layouts for all device sizes
- Smooth transitions and loading states
- Intuitive navigation and user flows
- Best practices for form design and validation
- User-friendly error messages

CODE REQUIREMENTS:
- Clean, maintainable code structure
- Reusable components and proper component composition
- Effective state management with ${stateManagement}
- Responsive design implementation
- Loading states and error handling
- Semantic HTML and accessibility
- Comments for complex logic

CRITICAL INSTRUCTION:
Your response MUST be valid, parsable JSON in exactly this format:
{
  "files": [
    {
      "name": "filename.ext",
      "path": "/path/to/file",
      "content": "file content",
      "language": "js|tsx|css|html|json",
      "type": "file"
    }
  ],
  "dependencies": { "package-name": "version" },
  "devDependencies": { "package-name": "version" }
}

AVOID COMMON ERRORS:
- Do not put backticks, markdown formatting, or explanations outside the JSON
- Ensure all quotes, brackets, and commas are properly balanced
- Double-check that all properties have values in the correct format
- Make sure all strings are properly escaped, especially when they contain quotes or special characters
- Do not use trailing commas in arrays or objects
`;

    // Generate content with system and user prompts with explicit JSON response requirement
    const fullPrompt = `${systemPrompt}

USER REQUEST: ${prompt}

RESPONSE FORMAT:
Only respond with a valid JSON object. Do not include any text before or after the JSON.
Do not use markdown code blocks, backticks, or any other formatting.
Ensure your JSON is properly formatted and can be parsed by JSON.parse().`;
    
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
            topK: 40,
            topP: 0.8,
            responseMimeType: "application/json",
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

    // Enhanced JSON extraction and cleaning
    let jsonText = text
      .trim()
      // If the LLM wrapped your JSON in ```json … ```
      .replace(/^```json?\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsedResponse: GeneratedApp;
    try {
      parsedResponse = JSON.parse(jsonText) as GeneratedApp;
    } catch (err: any) {
      console.error('❌ Failed to JSON.parse Gemini output:', err.message);
      console.error('Raw output was:\n', text);
      console.error('What we fed into JSON.parse was:\n', jsonText);
      throw new Error(`Failed to parse Ruby-style JSON from Gemini: ${err.message}`);
    }
    try {
      // First attempt to parse
      const parsedResponse = JSON.parse(jsonText);
      
      // Validate the structure
      if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
        throw new Error("Invalid response structure: missing or invalid files array");
      }

      // Clean up file contents
      parsedResponse.files = parsedResponse.files.map((file: { content?: string }) => ({
        ...file,
        content: file.content?.replace(/\\n/g, '\n') || ''
      }));

      return parsedResponse as GeneratedApp;
    } catch (parseError) {
      console.error("Parse error:", parseError, "\nCleaned JSON:", jsonText);
      throw parseError;
    }
  } catch (error: any) {
    console.error("Error generating application:", error);
    throw new Error(`Failed to generate application: ${error.message || "Unknown error"}`);
  }
}

// Function to analyze code creativity
export async function analyzeCodeCreativity(files: FileNode[]): Promise<CreativityMetrics> {
  try {
    // Get only file content for code analysis (exclude folders)
    const codeFiles = files.filter(file => file.type === "file" && file.content);
    
    if (codeFiles.length === 0) {
      throw new Error("No code files found for creativity analysis");
    }
    
    // Create a prompt that asks Gemini to evaluate code creativity
    const prompt = `Analyze the following code for creativity and innovation. 
    
CODE FILES FOR ANALYSIS:
${codeFiles.map(file => `--- ${file.path} ---
${file.content?.substring(0, 1000)}... (truncated)
`).join('\n')}

Provide a detailed assessment of the code's creativity based on these criteria:
1. Novelty: How original and unique are the approaches and patterns used?
2. Usefulness: How practical and functional is the implementation for solving the intended problem?
3. Elegance: How well-organized, efficient, and aesthetically pleasing is the code?
4. Robustness: How well does it handle edge cases and potential issues?

For each criterion, provide a score from 0-100 and a brief explanation.

Your response MUST be valid JSON in this exact format:
{
  "score": number,         // Overall creativity score (0-100)
  "novelty": number,       // Novelty score (0-100)
  "usefulness": number,    // Usefulness score (0-100)
  "elegance": number,      // Elegance score (0-100)
  "robustness": number,    // Robustness score (0-100)
  "description": "string"  // Brief overall assessment
}

RESPONSE FORMAT:
Only respond with valid JSON. Do not include any text before or after the JSON.
Do not use markdown code blocks, backticks, or other formatting.`;

    const model = geminiAPI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.8,
        responseMimeType: "application/json",
      }
    });

    const response = result.response;
    const text = response.text();
    
    // Clean up the JSON text using the same approach as in generateApp
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
    let jsonText = jsonMatch[1] || text;
    
    jsonText = jsonText.trim()
      .replace(/^[\s\S]*?(?=\{)/, '')
      .replace(/\}[\s\S]*$/, '}')
      .replace(/'/g, '"')
      .replace(/,(\s*[\]}])/g, '$1')
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
    
    try {
      const creativityMetrics = JSON.parse(jsonText) as CreativityMetrics;
      
      // Ensure all scores are within valid range
      const validateScore = (score: number) => Math.min(100, Math.max(0, score));
      
      return {
        score: validateScore(creativityMetrics.score),
        novelty: validateScore(creativityMetrics.novelty),
        usefulness: validateScore(creativityMetrics.usefulness),
        elegance: validateScore(creativityMetrics.elegance),
        robustness: validateScore(creativityMetrics.robustness),
        description: creativityMetrics.description || "Code creativity analysis completed."
      };
    } catch (error) {
      console.error("Error parsing creativity metrics:", error);
      // Provide default metrics if parsing fails
      return {
        score: 70,
        novelty: 65,
        usefulness: 75,
        elegance: 68,
        robustness: 72,
        description: "Unable to analyze code creativity accurately. Using default assessment."
      };
    }
  } catch (error) {
    console.error("Error analyzing code creativity:", error);
    // Return default values in case of error
    return {
      score: 65,
      novelty: 60,
      usefulness: 70,
      elegance: 65,
      robustness: 65,
      description: "Failed to analyze code creativity. Using default assessment."
    };
  }
}

// Test to check if the Gemini integration is working with JSON output
export async function testGeminiAPI(): Promise<string> {
  try {
    const model = geminiAPI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Add retry logic similar to generateApp
    let retries = 0;
    const maxRetries = 3;
    let result;
    
    const testPrompt = `Return a simple test object as valid JSON with this exact structure:
{
  "test": "success",
  "message": "Hello World",
  "timestamp": "current time"
}

IMPORTANT:
- Return ONLY JSON. No text or markdown formatting before or after.
- No code fences or backticks.
- Ensure the JSON can be parsed by JSON.parse().`;
    
    while (retries < maxRetries) {
      try {
        result = await model.generateContent({
          contents: [{ 
            role: "user", 
            parts: [{ text: testPrompt }] 
          }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            topK: 40,
            topP: 0.8,
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
    const text = response.text();
    
    // Test our JSON parsing logic
    try {
      // Extract and clean the JSON
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
      let jsonText = jsonMatch[1] || text;
      
      // Clean up the JSON text using the same improved logic as in generateApp
      jsonText = jsonText.trim()
        // Remove any non-JSON text before the opening brace
        .replace(/^[\s\S]*?(?=\{)/, '')
        // Remove everything after the last closing brace
        .replace(/\}[\s\S]*$/, '}')
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
        .replace(/:\s*([a-zA-Z0-9_]+)(\s*[,}])/g, ':"$1"$2')
        // Fix missing commas between property/value pairs
        .replace(/("[^"]+"\s*:\s*"[^"]+")(\s*)("[^"]+")/, '$1,$2$3')
        // Fix hanging properties in object (like "key": value with missing comma)
        .replace(/"([^"]+)":\s*"([^"]+)"(?!\s*[,}])/g, '"$1": "$2",');
      
      // Try to parse the JSON
      const parsedResponse = JSON.parse(jsonText);
      
      // Return success message with parsed data
      return `Gemini API test successful! Response: ${JSON.stringify(parsedResponse)}`;
    } catch (parseError: any) {
      // If parsing failed, return the raw text and error
      return `Gemini API responded but JSON parsing failed: ${parseError.message}. Raw response was: ${text.substring(0, 200)}...`;
    }
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

    // Build a comprehensive prompt optimized for reliable JSON response
    let prompt = `You are an expert ${framework} developer and UI/UX specialist. Your task is to fix errors and enhance a web application.

ERRORS DETECTED:
${errors.map((error, i) => `${i+1}. ${error}`).join('\n')}

FILES WITH ISSUES:`;

    // Add the files content to the prompt
    const relevantFiles = files.filter(f => f.type === "file" && f.content);
    relevantFiles.forEach(file => {
      prompt += `\n--- File: ${file.path} ---\n${file.content}\n`;
    });

    prompt += `
REQUIRED FIXES:
1. Fix all technical errors in the code
2. Enhance UI/UX with:
   - Better spacing, typography, and color usage
   - Smooth transitions and loading states
   - Improved component structure and reusability
   - Responsive design enhancements
   - Better accessibility
   - More intuitive interface

CRITICAL INSTRUCTION:
Your response MUST be valid, parsable JSON in exactly this format:
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

AVOID COMMON ERRORS:
- Do not put backticks, markdown formatting, or explanations outside the JSON
- Ensure all quotes, brackets, and commas are properly balanced
- Double-check that all properties have values in the correct format
- Make sure all strings are properly escaped, especially when they contain quotes or special characters
- Do not use trailing commas in arrays or objects

RESPONSE FORMAT:
Only respond with a valid JSON object. Do not include any text before or after the JSON.
Do not use markdown code blocks, backticks, or any other formatting.
Ensure your JSON is properly formatted and can be parsed by JSON.parse().`;

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
            topK: 40,
            topP: 0.8,
            responseMimeType: "application/json",
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
    const text = await response.text();

    // Enhance the response format requirements
    const responseFormat = `
RESPONSE FORMAT REQUIREMENTS:
1. Return ONLY valid JSON
2. Format for each file:
   - Use proper escaping for special characters
   - Ensure content is properly formatted
   - Include complete implementation
3. Structure:
{
  "files": [
    {
      "name": "string",
      "path": "string",
      "content": "string",
      "language": "string",
      "type": "file"
    }
  ],
  "dependencies": {
    "package-name": "version"
  },
  "devDependencies": {
    "package-name": "version"
  }
}`;

    const fullPrompt = `${prompt}\n\n${responseFormat}`;

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
    let jsonText = jsonMatch[1] || text;
    
    // Clean up the JSON text to handle common issues - same as in generateApp
    jsonText = jsonText.trim()
      // Remove any non-JSON text before the opening brace
      .replace(/^[\s\S]*?(?=\{)/, '')
      // Remove everything after the last closing brace
      .replace(/\}[\s\S]*$/, '}')
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
      .replace(/:\s*([a-zA-Z0-9_]+)(\s*[,}])/g, ':"$1"$2')
      // Fix missing commas between property/value pairs
      .replace(/("[^"]+"\s*:\s*"[^"]+")(\s*)("[^"]+")/, '$1,$2$3')
      // Fix hanging properties in object (like "key": value with missing comma)
      .replace(/"([^"]+)":\s*"([^"]+)"(?!\s*[,}])/g, '"$1": "$2",');
      
    try {
      // First, try to parse the cleaned JSON
      let fixedResponse;
      try {
        fixedResponse = JSON.parse(jsonText);
      } catch (initialParseError: any) {
        console.warn("Initial JSON parsing failed in fix app, attempting to fix:", initialParseError.message);
        
        // Check for the specific "position 98" error that we're seeing
        if (initialParseError.message.includes("position 98")) {
          console.log("Detected position 98 error in fixAppErrors, applying targeted fix...");
          
          // Inspect the problem area
          const problematicArea = jsonText.substring(90, 110);
          console.log("Text around position 98:", problematicArea);
          
          // Try adding a missing comma at position 98
          const fixedText = jsonText.substring(0, 98) + "," + jsonText.substring(98);
          try {
            fixedResponse = JSON.parse(fixedText);
            console.log("Position 98 fix successful!");
            // If this works, we're done
            jsonText = fixedText; // Update jsonText for further processing if needed
          } catch (commaFixError) {
            console.log("Comma fix did not work, trying alternative approaches");
            
            // Try fixing possible missing quotes around a value
            const fixedText2 = jsonText.substring(0, 98) + '"' + jsonText.substring(98);
            try {
              fixedResponse = JSON.parse(fixedText2);
              console.log("Quote fix successful!");
              jsonText = fixedText2;
            } catch (quoteFixError) {
              console.log("Quote fix did not work either, falling back to general fixes");
            }
          }
        }
        
        // If still not fixed, try more aggressive approaches
        if (!fixedResponse) {
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
            
            // Additional cleanup - often helps with Gemini responses
            jsonText = jsonText
              // Replace any backslashes in front of quotes with double backslashes
              .replace(/\\"/g, '\\\\"')
              // Fix property/value pairs - ensure proper formatting
              .replace(/([{,]\s*)([^"]\w+)\s*:\s*"([^"]+)"/g, '$1"$2":"$3"')
              // Add missing commas between objects
              .replace(/}(\s*){/g, '},\n{')
              // Fix property values missing quotes
              .replace(/:\s*([^",{}\[\]\s][^,{}"\[\]\s]*)\s*([,}])/g, ':"$1"$2');
            
            // Try parsing again
            try {
              fixedResponse = JSON.parse(jsonText);
              console.log("Fixed JSON with aggressive cleaning!");
            } catch (secondParseError: any) {
              console.error("Second parse attempt failed:", secondParseError.message);
              
              // Last resort - manually fix the JSON by reconstructing the basic structure
              try {
                // Extract any valid file objects we can find
                const fileMatches = jsonText.match(/"path"\s*:\s*"[^"]+"\s*,\s*"content"\s*:\s*"[^"]*"\s*,\s*"type"\s*:\s*"file"\s*,\s*"name"\s*:\s*"[^"]*"/g);
                
                if (fileMatches && fileMatches.length > 0) {
                  // Rebuild a minimal valid structure
                  const minimalJsonText = `{"files":[{${fileMatches[0]}}]}`;
                  fixedResponse = JSON.parse(minimalJsonText);
                  console.log("Created minimal valid JSON from extracted content in fixAppErrors");
                } else {
                  throw new Error("Could not extract valid file data");
                }
              } catch (e) {
                // If all parsing attempts fail, throw the original error
                console.error("All parsing attempts failed in fixAppErrors");
                throw initialParseError;
              }
            }
          } else {
            // If we can't find the start of a JSON structure, throw the original error
            throw initialParseError;
          }
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