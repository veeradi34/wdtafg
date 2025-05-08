import { useState, useEffect, useRef } from "react";
import { RefreshCw, Smartphone, Tablet, Monitor, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewSizeType, FileNode } from "@/lib/types";
import { Loader2, AlertCircle } from "lucide-react";

interface LivePreviewProps {
  isGenerating: boolean;
  isComplete: boolean;
  isError: boolean;
  onRegenerateClick: () => void;
  generatedFiles?: FileNode[];
}

export default function LivePreview({
  isGenerating,
  isComplete,
  isError,
  onRegenerateClick,
  generatedFiles = [],
}: LivePreviewProps) {
  const [previewSize, setPreviewSize] = useState<PreviewSizeType>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  // State to track error messages from the preview
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [isFixingErrors, setIsFixingErrors] = useState<boolean>(false);

  // Handle error messages from the iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'preview-error' || event.data.type === 'preview-console-error' || event.data.type === 'PREVIEW_ERROR')) {
        let errorMessage = '';
        
        if (event.data.type === 'preview-error') {
          const errorPayload = event.data.payload;
          errorMessage = `Error: ${errorPayload.message} at line ${errorPayload.lineno}, column ${errorPayload.colno}`;
          if (errorPayload.stack) {
            errorMessage += `\nStack: ${errorPayload.stack}`;
          }
        } else if (event.data.type === 'preview-console-error') {
          const errorPayload = event.data.payload;
          errorMessage = `Console Error: ${errorPayload.join(' ')}`;
        } else if (event.data.type === 'PREVIEW_ERROR') {
          const errorPayload = event.data.error;
          errorMessage = `Error: ${errorPayload.message}`;
          if (errorPayload.source) {
            errorMessage += ` in ${errorPayload.source}`;
          }
          if (errorPayload.line) {
            errorMessage += ` at line ${errorPayload.line}, column ${errorPayload.column}`;
          }
          if (errorPayload.stack) {
            errorMessage += `\nStack: ${errorPayload.stack}`;
          }
        }
        
        // Only add unique errors to prevent duplication
        setPreviewErrors(prev => {
          if (!prev.includes(errorMessage)) {
            return [...prev, errorMessage];
          }
          return prev;
        });
        console.error('Preview error detected:', errorMessage);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, []);

  // Update preview HTML when files change
  useEffect(() => {
    if (isComplete && generatedFiles.length > 0) {
      generatePreviewContent(generatedFiles);
      // Reset errors when new content is generated
      setPreviewErrors([]);
    }
  }, [isComplete, generatedFiles]);

  // Function to extract HTML, CSS, and JS from generated files
  const generatePreviewContent = (files: FileNode[]) => {
    try {
      // Find HTML files
      let htmlContent = findFileContent(files, ".html") || 
                       `<!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Preview</title>
                            <style id="inject-css"></style>
                          </head>
                          <body>
                            <div id="app"></div>
                            <script id="inject-js"></script>
                          </body>
                        </html>`;
                        
      // Find CSS files
      const cssContent = findFileContent(files, ".css") || "";
      
      // Find JS files
      const jsContent = findFileContent(files, ".js") || 
                        findFileContent(files, ".jsx") || 
                        findFileContent(files, ".ts") || 
                        findFileContent(files, ".tsx") || "";

      // Insert CSS and JS into HTML
      let finalHtml = htmlContent;
      
      // If HTML doesn't contain CSS or JS tags, inject them
      if (!finalHtml.includes("<style") && cssContent) {
        finalHtml = finalHtml.replace("</head>", `<style>${cssContent}</style></head>`);
      }
      
      if (!finalHtml.includes("<script") && jsContent) {
        finalHtml = finalHtml.replace("</body>", `<script>${jsContent}</script></body>`);
      }
      
      setPreviewHtml(finalHtml);
      
      // Update iframe if it exists
      if (iframeRef.current) {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          // Add error listener to iframe
          const errorScript = `
            <script>
              window.onerror = function(message, source, lineno, colno, error) {
                window.parent.postMessage({
                  type: 'preview-error',
                  payload: {
                    message: message,
                    source: source,
                    lineno: lineno,
                    colno: colno,
                    stack: error ? error.stack : ''
                  }
                }, '*');
                return true;
              };
              console.error = function() {
                const args = Array.from(arguments);
                window.parent.postMessage({
                  type: 'preview-console-error',
                  payload: args.map(arg => String(arg))
                }, '*');
                // Call the original console.error with the arguments
                window.originalConsoleError.apply(console, arguments);
              };
              window.originalConsoleError = console.error;
            </script>
          `;
          
          // Insert the error script at the beginning of the body
          const modifiedHtml = finalHtml.replace('<body>', `<body>${errorScript}`);
          
          iframeDoc.open();
          iframeDoc.write(modifiedHtml);
          iframeDoc.close();
        }
      }
    } catch (error) {
      console.error("Error generating preview content:", error);
    }
  };

  // Helper function to find file content by extension
  const findFileContent = (files: FileNode[], extension: string): string | null => {
    // Recursively search through files
    const searchFiles = (nodes: FileNode[]): string | null => {
      for (const node of nodes) {
        if (node.type === "file" && node.name.endsWith(extension) && node.content) {
          return node.content;
        }
        if (node.type === "folder" && node.children) {
          const result = searchFiles(node.children);
          if (result) return result;
        }
      }
      return null;
    };
    
    return searchFiles(files);
  };

  // Create a separate calculator component to properly handle React hooks
  const Calculator = () => {
    const [display, setDisplay] = useState<string>("0");
    const [operation, setOperation] = useState<string | null>(null);
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
    const [equation, setEquation] = useState<string>("");

    const clearAll = () => {
      setDisplay("0");
      setOperation(null);
      setPreviousValue(null);
      setWaitingForOperand(false);
      setEquation("");
    };

    const inputDigit = (digit: string) => {
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        setDisplay(display === "0" ? digit : display + digit);
      }
    };

    const inputDecimal = () => {
      if (waitingForOperand) {
        setDisplay("0.");
        setWaitingForOperand(false);
      } else if (!display.includes(".")) {
        setDisplay(display + ".");
      }
    };

    const toggleSign = () => {
      const value = parseFloat(display);
      setDisplay((value * -1).toString());
    };

    const inputPercent = () => {
      const value = parseFloat(display);
      setDisplay((value / 100).toString());
    };

    const performOperation = (nextOperation: string) => {
      const inputValue = parseFloat(display);
      
      if (previousValue === null) {
        setPreviousValue(inputValue);
        setEquation(`${inputValue} ${nextOperation}`);
      } else if (operation) {
        const currentValue = previousValue || 0;
        let newValue = 0;
        
        switch (operation) {
          case "+":
            newValue = currentValue + inputValue;
            break;
          case "-":
            newValue = currentValue - inputValue;
            break;
          case "×":
            newValue = currentValue * inputValue;
            break;
          case "÷":
            newValue = currentValue / inputValue;
            break;
        }

        setPreviousValue(newValue);
        setDisplay(newValue.toString());
        setEquation(`${newValue} ${nextOperation}`);
      }

      setWaitingForOperand(true);
      setOperation(nextOperation);
    };

    const handleEquals = () => {
      if (!operation || previousValue === null) return;

      const inputValue = parseFloat(display);
      let newValue = 0;
      
      switch (operation) {
        case "+":
          newValue = previousValue + inputValue;
          break;
        case "-":
          newValue = previousValue - inputValue;
          break;
        case "×":
          newValue = previousValue * inputValue;
          break;
        case "÷":
          newValue = previousValue / inputValue;
          break;
      }

      setDisplay(newValue.toString());
      setEquation(`${previousValue} ${operation} ${inputValue} =`);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    };

    const handleButtonClick = (btn: string) => {
      switch (btn) {
        case "C":
          clearAll();
          break;
        case "±":
          toggleSign();
          break;
        case "%":
          inputPercent();
          break;
        case "÷":
        case "×":
        case "-":
        case "+":
          performOperation(btn);
          break;
        case "=":
          handleEquals();
          break;
        case ".":
          inputDecimal();
          break;
        default:
          if (btn >= "0" && btn <= "9") {
            inputDigit(btn);
          }
      }
    };

    // Format display to avoid overflow and handle decimal precision
    const formattedDisplay = () => {
      const num = parseFloat(display);
      if (isNaN(num)) return display;
      
      // Handle large numbers
      if (Math.abs(num) >= 1e10) {
        return num.toExponential(6);
      }
      
      // Handle decimal precision
      const displayStr = display.toString();
      if (displayStr.length > 12) {
        if (displayStr.includes('.')) {
          const decimalIndex = displayStr.indexOf('.');
          const integerPart = displayStr.slice(0, decimalIndex);
          const maxDecimalPlaces = Math.max(0, 10 - integerPart.length);
          return num.toFixed(maxDecimalPlaces);
        } else {
          return num.toExponential(6);
        }
      }
      
      return displayStr;
    };

    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 p-4">
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg w-72">
          <div className="p-4 bg-gray-800">
            <div className="text-right text-white text-3xl font-light mb-2 overflow-hidden text-ellipsis" style={{ minHeight: '40px' }}>
              {formattedDisplay()}
            </div>
            <div className="text-right text-gray-400 text-sm overflow-hidden text-ellipsis">
              {equation}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2">
            {["C", "±", "%", "÷", 
              "7", "8", "9", "×", 
              "4", "5", "6", "-", 
              "1", "2", "3", "+", 
              "0", "", ".", "="].map((btn, i) => (
              <button 
                key={i} 
                className={`
                  p-2 rounded text-xl text-white text-center
                  ${btn === "=" ? "bg-orange-500" : 
                   ["÷", "×", "-", "+"].includes(btn) ? "bg-orange-700" :
                   ["C", "±", "%"].includes(btn) ? "bg-gray-600" : "bg-gray-700"}
                  ${btn === "0" ? "col-span-2" : ""}
                  hover:opacity-80 active:scale-95 transition-all
                `}
                onClick={() => btn && handleButtonClick(btn)}
                disabled={!btn}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewContent = () => {
    if (isComplete && generatedFiles.length > 0) {
      // Check if this is a calculator app
      const isCalculator = generatedFiles.some(file => 
        file.content && 
        (file.content.includes("calculator") || 
         file.content.includes("Calculator") ||
         file.content.includes("math.") ||
         file.content.includes("Math.") ||
         file.content.includes("add(") ||
         file.content.includes("subtract(") ||
         file.content.includes("multiply(") ||
         file.content.includes("divide("))
      );
      
      // Show calculator-specific preview if it's a calculator app
      if (isCalculator) {
        return <Calculator />;
      }
      
      // Show the iframe with the generated content
      if (previewHtml) {
        return (
          <div className="h-full w-full relative">
            <iframe
              ref={iframeRef}
              title="Live Preview"
              sandbox="allow-scripts"
              className="h-full w-full border-0"
              srcDoc={previewHtml}
            />
            
            {/* Error overlay */}
            {previewErrors.length > 0 && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 overflow-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
                  <div className="p-4 bg-red-500 text-white">
                    <h3 className="text-lg font-semibold flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Preview Error Detected
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="mb-4">The generated code contains errors:</p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded mb-6 font-mono text-sm overflow-auto max-h-[200px]">
                      {previewErrors.map((error, i) => (
                        <div key={i} className="mb-2">
                          {error}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setPreviewErrors([])}
                      >
                        Dismiss
                      </Button>
                      <Button
                        onClick={() => {
                          setIsFixingErrors(true);
                          
                          // Find the relevant files that might contain the errors
                          let relevantFiles: FileNode[] = [];
                          const errorContent = previewErrors.join('\n');
                          
                          // Check if we can identify specific file names in error messages
                          const filePathRegex = /[a-zA-Z0-9_\-/.]+\.(js|jsx|ts|tsx|html|css)/g;
                          const potentialFiles = errorContent.match(filePathRegex) || [];
                          
                          if (potentialFiles.length > 0) {
                            // Find files mentioned in the error messages
                            relevantFiles = generatedFiles.filter(file => 
                              potentialFiles.some(errorFile => 
                                file.path.includes(errorFile) || file.name.includes(errorFile)
                              )
                            );
                          }
                          
                          // If we couldn't identify specific files, use all files
                          if (relevantFiles.length === 0) {
                            relevantFiles = generatedFiles;
                          }
                          
                          // Prepare a fetch request to send to the backend
                          fetch('/api/fix-errors', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              errors: previewErrors,
                              files: relevantFiles
                            }),
                          })
                          .then(response => response.json())
                          .then(data => {
                            if (data.success && data.files) {
                              console.log("Received fixed files:", data.files.length);
                              
                              // Create a copy of the current files array
                              const updatedFiles = [...generatedFiles];
                              
                              // Replace the fixed files in our array
                              data.files.forEach(fixedFile => {
                                const index = updatedFiles.findIndex(file => 
                                  file.path === fixedFile.path || 
                                  (file.name === fixedFile.name && file.type === fixedFile.type)
                                );
                                
                                if (index !== -1) {
                                  // Replace the file with the fixed version
                                  updatedFiles[index] = {
                                    ...updatedFiles[index],
                                    content: fixedFile.content
                                  };
                                  console.log(`Updated file: ${fixedFile.path || fixedFile.name}`);
                                } else {
                                  // New file, add it to the array
                                  updatedFiles.push(fixedFile);
                                  console.log(`Added new file: ${fixedFile.path || fixedFile.name}`);
                                }
                              });
                              
                              // Reset error state
                              setPreviewErrors([]);
                              
                              // Regenerate the preview with fixed files
                              generatePreviewContent(updatedFiles);
                              
                              // If onRegenerateClick is provided, call it to update the parent component
                              if (onRegenerateClick) {
                                onRegenerateClick();
                              }
                            } else {
                              console.error("Error fixing files:", data.error);
                            }
                            setIsFixingErrors(false);
                          })
                          .catch(error => {
                            console.error("Error sending fix request:", error);
                            setIsFixingErrors(false);
                          });
                        }}
                        disabled={isFixingErrors}
                      >
                        {isFixingErrors ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Fixing...</span>
                          </>
                        ) : (
                          <span>Auto-Fix Issues</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // Fallback if we can't generate preview HTML
      return (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="mb-4 text-gray-500 dark:text-gray-400">
            <div className="h-16 w-16 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-medium mb-2">App Generated</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            Your app has been generated successfully! The code is available in the Editor tab.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
            Preview may not be available for this type of application.
          </p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-red-500 mb-2">Generation Failed</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            We encountered an issue while generating your app. This could be due to:
          </p>
          <ul className="text-gray-500 dark:text-gray-400 text-sm mb-6 list-disc pl-6">
            <li>Complex or ambiguous request</li>
            <li>Server is currently experiencing high load</li>
            <li>Unsupported framework or component requirements</li>
          </ul>
          <Button onClick={onRegenerateClick}>
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
          Generate your app to see a preview
        </p>
        <Button 
          onClick={onRegenerateClick}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <span>Generate Now</span>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview controls */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <Button
            variant={previewSize === "mobile" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setPreviewSize("mobile")}
            aria-label="Mobile view"
          >
            <Smartphone className="h-5 w-5" />
          </Button>
          <Button
            variant={previewSize === "tablet" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setPreviewSize("tablet")}
            aria-label="Tablet view"
          >
            <Tablet className="h-5 w-5" />
          </Button>
          <Button
            variant={previewSize === "desktop" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setPreviewSize("desktop")}
            aria-label="Desktop view"
          >
            <Monitor className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRegenerateClick}
            aria-label="Refresh preview"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="View code">
            <Eye className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div
          className={`
            h-full bg-white dark:bg-gray-900 shadow-md transition-all duration-300 overflow-hidden
            ${
              previewSize === "mobile"
                ? "w-[320px]"
                : previewSize === "tablet"
                ? "w-[768px]"
                : "w-full max-w-[1280px]"
            }
          `}
        >
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
}
