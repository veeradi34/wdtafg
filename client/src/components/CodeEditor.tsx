import { useState, useEffect } from "react";
import { FileNode } from "@/lib/types";
import { MoreHorizontal } from "lucide-react";

interface CodeEditorProps {
  activeFile: string;
  files: FileNode[];
}

export default function CodeEditor({ activeFile, files }: CodeEditorProps) {
  const [fileContent, setFileContent] = useState<string>("");
  const [language, setLanguage] = useState<string>("jsx");

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

  return (
    <div className="flex flex-col h-full">
      {/* Code editor header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center">
          <span className="text-sm font-medium px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700">
            {activeFile}
          </span>
        </div>
        <div className="flex space-x-2">
          <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Code editor content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 p-4 font-mono text-sm">
        <pre className={`language-${language}`}>
          <code className="text-gray-800 dark:text-gray-200">
            {fileContent}
          </code>
        </pre>
      </div>
    </div>
  );
}
