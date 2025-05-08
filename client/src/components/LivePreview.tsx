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
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [isFixingErrors, setIsFixingErrors] = useState<boolean>(false);
  
  // Debug logging
  console.log("LivePreview render", { isComplete, isGenerating, filesCount: generatedFiles.length });

  // Handle error messages from the iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'preview-error' || event.data.type === 'preview-console-error')) {
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
        }
        
        // Only add unique errors to prevent duplication
        setPreviewErrors(prev => {
          if (!prev.includes(errorMessage)) {
            return [...prev, errorMessage];
          }
          return prev;
        });
      }
    };
    
    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, []);

  // Update preview HTML when files change
  useEffect(() => {
    console.log("LivePreview effect triggered", { isComplete, filesCount: generatedFiles.length });
    
    if (isComplete && generatedFiles.length > 0) {
      renderPreview(generatedFiles);
      setPreviewErrors([]);
    }
  }, [isComplete, generatedFiles]);

  // Render the preview content
  const renderPreview = (files: FileNode[]) => {
    try {
      console.log("Processing files for preview:", files.map(f => f.name));
      
      // Find HTML file - prioritize index.html
      const htmlFile = files.find(file => 
        file.type === "file" && file.name === "index.html" && file.content
      );
      
      // Create a basic HTML template if no HTML file is found
      const defaultHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style id="injected-css"></style>
  </head>
  <body>
    <div id="root"></div>
    <div id="app"></div>
    <script id="injected-js"></script>
  </body>
</html>`;

      // Use the found HTML file or the default template
      let htmlContent = htmlFile?.content || defaultHtml;
      
      // Collect all CSS content
      let cssContent = "";
      files.forEach(file => {
        if (file.type === "file" && file.name.endsWith(".css") && file.content) {
          cssContent += `/* ${file.name} */\n${file.content}\n\n`;
        }
      });
      
      // Collect all JS content
      let jsContent = "";
      const jsFiles = files.filter(file => 
        file.type === "file" && 
        (file.name.endsWith(".js") || file.name.endsWith(".jsx")) &&
        file.content
      );
      
      // Sort JS files to ensure app.js runs last
      jsFiles.sort((a, b) => {
        if (a.name === "app.js") return 1;
        if (b.name === "app.js") return -1;
        return a.name.localeCompare(b.name);
      });
      
      // Concatenate all JS content in the sorted order
      jsFiles.forEach(file => {
        jsContent += `// ${file.name}\n${file.content}\n\n`;
      });
      
      // Add CSS to HTML if needed
      if (cssContent) {
        htmlContent = htmlContent.replace(/<\/head>/i, `<style>${cssContent}</style></head>`);
      }
      
      // Add JS to HTML if needed
      if (jsContent) {
        htmlContent = htmlContent.replace(/<\/body>/i, `<script>${jsContent}</script></body>`);
      }
      
      // Add error tracking script
      const errorScript = `
<script>
  // Capture JS errors
  window.onerror = function(message, source, line, column, error) {
    window.parent.postMessage({
      type: 'preview-error',
      payload: {
        message: message,
        source: source,
        lineno: line,
        colno: column,
        stack: error ? error.stack : ''
      }
    }, '*');
    console.error('Error:', message, source, line, column, error);
  };
  
  // Capture console errors
  const originalConsoleError = console.error;
  console.error = function() {
    const args = Array.from(arguments);
    window.parent.postMessage({
      type: 'preview-console-error',
      payload: args.map(arg => String(arg))
    }, '*');
    originalConsoleError.apply(console, arguments);
  };
  
  // Signal successful load
  window.addEventListener('load', function() {
    console.log('Preview loaded successfully');
  });
</script>
`;
      
      // Add the error script to the HTML body
      htmlContent = htmlContent.replace(/<body>/i, `<body>${errorScript}`);
      
      setPreviewHtml(htmlContent);
      
      // Update iframe content
      if (iframeRef.current) {
        const iframeDoc = iframeRef.current.contentDocument || 
                          (iframeRef.current.contentWindow && iframeRef.current.contentWindow.document);
        
        if (iframeDoc) {
          console.log("Updating iframe content");
          try {
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();
          } catch (e) {
            console.error("Error writing to iframe:", e);
          }
        } else {
          console.error("Could not access iframe document");
        }
      } else {
        console.error("iframe reference is null");
      }
    } catch (error) {
      console.error("Error generating preview content:", error);
    }
  };

  // Helper function to find file content by extension (used for backward compatibility)
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

  // Render a loading state while generating
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Generating Your App</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          We're crafting your application based on your description. This may take a few moments...
        </p>
      </div>
    );
  }
  
  // Render an error state if generation failed
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-gray-50 dark:bg-gray-900">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Generation Failed</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          We encountered an error while generating your application. Please try again with a different prompt.
        </p>
        <Button onClick={onRegenerateClick} className="flex items-center">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }
  
  // Render a prompt to start if no generation has happened yet
  if (!isComplete && generatedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-gray-50 dark:bg-gray-900">
        <Eye className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Preview Your App</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          Enter a description and click "Generate App" to see a live preview of your application here.
        </p>
      </div>
    );
  }

  // Render errors if there are any
  if (previewErrors.length > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="font-medium text-red-500">
              Preview Errors ({previewErrors.length})
            </span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPreviewErrors([])}
              className="text-red-500 border-red-200 hover:border-red-300"
            >
              Clear Errors
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-red-50 dark:bg-red-900/10">
          {previewErrors.map((error, index) => (
            <div key={index} className="mb-4 p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-md">
              <pre className="whitespace-pre-wrap text-sm text-red-500">{error}</pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main render with preview controls and iframe
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Preview size controls */}
      <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex space-x-2">
          <Button
            variant={previewSize === "mobile" ? "default" : "outline"}
            size="icon"
            onClick={() => setPreviewSize("mobile")}
            className="h-8 w-8"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            variant={previewSize === "tablet" ? "default" : "outline"}
            size="icon"
            onClick={() => setPreviewSize("tablet")}
            className="h-8 w-8"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={previewSize === "desktop" ? "default" : "outline"}
            size="icon"
            onClick={() => setPreviewSize("desktop")}
            className="h-8 w-8"
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (iframeRef.current) {
              try {
                iframeRef.current.contentWindow?.location.reload();
              } catch (e) {
                console.error("Failed to reload iframe:", e);
                // Alternative approach for cross-origin frames
                if (iframeRef.current.contentDocument) {
                  iframeRef.current.contentDocument.open();
                  iframeRef.current.contentDocument.write(previewHtml);
                  iframeRef.current.contentDocument.close();
                }
              }
            }
          }}
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Preview area */}
      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 p-4 flex justify-center items-start">
        <div 
          className={`bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden transition-all duration-300 flex flex-col ${
            previewSize === "desktop" 
              ? "w-full h-full" 
              : previewSize === "tablet" 
              ? "w-[768px] h-[1024px]" 
              : "w-[375px] h-[667px]"
          }`}
        >
          <iframe
            ref={iframeRef}
            title="App Preview"
            className="flex-1 w-full h-full"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>
    </div>
  );
}