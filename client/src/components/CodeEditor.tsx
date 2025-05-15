import { useState, useEffect } from "react";
import { FileNode } from "@/lib/types";

interface CodeEditorProps {
  activeFile: string;
  files: FileNode[];
}

export default function CodeEditor({ activeFile, files }: CodeEditorProps) {
  const [fileContent, setFileContent] = useState<string>("");
  const [language, setLanguage] = useState<string>("jsx");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Find the content of the active file
  useEffect(() => {
    const findFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.type === "file" && node.name === activeFile) {
          return node;
        }
        if (node.type === "folder" && node.children) {
          const found = findFile(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(files);
    if (file) {
      setFileContent(file.content || "// No content available");
      setLanguage(file.language || getLanguageFromFilename(file.name));
    } else {
      setFileContent("// File not found");
      setLanguage("jsx");
    }
  }, [activeFile, files]);

  // Function to determine language based on file extension
  const getLanguageFromFilename = (filename: string): string => {
    const extension = filename.split('.').pop() || "";
    const extensionMap: Record<string, string> = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "typescript",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
    };
    return extensionMap[extension] || "text";
  };

  // Handle minimize button action
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle maximize/restore button action
  const handleMaximize = () => {
    setIsFullscreen(!isFullscreen);
    
    // If going fullscreen, add class to document body
    if (!isFullscreen) {
      document.documentElement.classList.add('editor-fullscreen');
    } else {
      document.documentElement.classList.remove('editor-fullscreen');
    }
  };

  return (
    <div 
      className={`flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-gray-950' : 'h-full'
      } ${isMinimized ? 'h-12 overflow-hidden' : 'h-full'}`}
    >
      {/* Code editor header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center">
          {/* Window controls - ONLY yellow and green buttons */}
          <div className="flex space-x-1.5 mr-4">
            {/* Yellow minimize button */}
            <button 
              onClick={handleMinimize}
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors relative group"
              aria-label="Minimize"
            >
              <span className="absolute opacity-0 group-hover:opacity-100 top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-900">
                  <path d="M5 12h14"></path>
                </svg>
              </span>
            </button>
            {/* Green maximize button */}
            <button 
              onClick={handleMaximize}
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors relative group"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <span className="absolute opacity-0 group-hover:opacity-100 top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-green-900">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                    <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-green-900">
                    <path d="M15 3h6v6"></path>
                    <path d="M9 21H3v-6"></path>
                    <path d="M21 3l-7 7"></path>
                    <path d="M3 21l7-7"></path>
                  </svg>
                )}
              </span>
            </button>
          </div>
          
          <span className="bg-gray-700 rounded px-2 py-1 text-gray-300 font-mono text-sm">{activeFile}</span>
        </div>
      </div>

      {/* Only show code content when not minimized */}
      {!isMinimized && (
        <div className="flex flex-1 overflow-hidden">
          {/* Line numbers */}
          <div className="py-4 px-3 text-right bg-gray-900 text-gray-500 border-r border-gray-800 select-none w-12 flex-shrink-0">
            {fileContent.split('\n').map((_, i) => (
              <div key={i} className="leading-6 text-xs">{i + 1}</div>
            ))}
          </div>
          
          {/* Code content */}
          <div className="flex-1 overflow-auto bg-gray-950 p-4">
            <pre className="font-mono text-sm leading-6 text-gray-300 font-['JetBrains_Mono',_'Fira_Code',_'SF_Mono',_'Menlo',_monospace]">
              <code>
                <div className="whitespace-pre">
                  {/* Manually formatted JSX code for App.jsx */}
                  {activeFile === "App.jsx" && (
                    <>
                      <div><span className="text-purple-400">import</span> <span className="text-yellow-300">React</span> <span className="text-purple-400">from</span> <span className="text-green-300">'react'</span></div>
                      <div><span className="text-purple-400">import</span> <span className="text-green-300">'./App.css'</span></div>
                      <div></div>
                      <div><span className="text-purple-400">function</span> <span className="text-yellow-300">App</span>() {'{'}</div>
                      <div>&nbsp;&nbsp;<span className="text-purple-400">return</span> (</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">div</span> <span className="text-blue-300">className</span>=<span className="text-green-300">"app"</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">header</span> <span className="text-blue-300">className</span>=<span className="text-green-300">"app-header"</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">h1</span>&gt;Generated App&lt;/<span className="text-red-400">h1</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-red-400">header</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">main</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">p</span>&gt;Your app content will appear here&lt;/<span className="text-red-400">p</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-red-400">main</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-red-400">div</span>&gt;</div>
                      <div>&nbsp;&nbsp;)</div>
                      <div>{'}'}</div>
                      <div></div>
                      <div><span className="text-purple-400">export</span> <span className="text-purple-400">default</span> <span className="text-yellow-300">App</span></div>
                    </>
                  )}
                  
                  {/* Manually formatted JSX code for main.jsx */}
                  {activeFile === "main.jsx" && (
                    <>
                      <div><span className="text-purple-400">import</span> <span className="text-yellow-300">React</span> <span className="text-purple-400">from</span> <span className="text-green-300">'react'</span></div>
                      <div><span className="text-purple-400">import</span> <span className="text-yellow-300">ReactDOM</span> <span className="text-purple-400">from</span> <span className="text-green-300">'react-dom/client'</span></div>
                      <div><span className="text-purple-400">import</span> <span className="text-yellow-300">App</span> <span className="text-purple-400">from</span> <span className="text-green-300">'./App'</span></div>
                      <div><span className="text-purple-400">import</span> <span className="text-green-300">'./index.css'</span></div>
                      <div><span className="text-yellow-300">ReactDOM</span>.<span className="text-blue-300">createRoot</span>(document.<span className="text-blue-300">getElementById</span>(<span className="text-green-300">'root'</span>)).<span className="text-blue-300">render</span>(</div>
                      <div>&nbsp;&nbsp;&lt;<span className="text-yellow-300">React.StrictMode</span>&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-yellow-300">App</span> /&gt;</div>
                      <div>&nbsp;&nbsp;&lt;/<span className="text-yellow-300">React.StrictMode</span>&gt;</div>
                      <div>)</div>
                    </>
                  )}
                  
                  {/* For other files, just show the content without syntax highlighting */}
                  {activeFile !== "App.jsx" && activeFile !== "main.jsx" && fileContent.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}