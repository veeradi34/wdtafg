import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Share, AlertCircle, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import PromptInput from "@/components/PromptInput";
import ProjectSettingsComponent from "@/components/ProjectSettings";
import ProjectFiles from "@/components/ProjectFiles";
import CodeEditor from "@/components/CodeEditor";
import LivePreview from "@/components/LivePreview";
import DependenciesView from "@/components/DependenciesView";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useAppGeneration } from "@/hooks/useAppGeneration";
import { 
  TabType, 
  ProjectSettings, 
  FileNode, 
  Dependency 
} from "@/lib/types";
import { GeneratedApp } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [activeFile, setActiveFile] = useState("App.jsx");
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    framework: "React",
    styling: "Tailwind CSS",
    stateManagement: "React Hooks",
    buildTool: "Vite",
  });
  
  // Mock files structure until generation
  const [files, setFiles] = useState<FileNode[]>([
    { 
      name: "package.json", 
      path: "/package.json", 
      type: "file", 
      language: "json",
      content: `{
  "name": "generated-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}`
    },
    { 
      name: "src", 
      path: "/src", 
      type: "folder", 
      expanded: true, 
      children: [
        { 
          name: "App.jsx", 
          path: "/src/App.jsx", 
          type: "file", 
          language: "jsx",
          content: `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Generated App</h1>
      </header>
      <main>
        <p>Your app content will appear here</p>
      </main>
    </div>
  )
}

export default App`
        },
        { 
          name: "main.jsx", 
          path: "/src/main.jsx", 
          type: "file", 
          language: "jsx",
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
        }
      ]
    }
  ]);
  
  // Demo dependencies
  const [dependencies, setDependencies] = useState<Dependency[]>([
    { name: "react", version: "^18.2.0", category: "Core" },
    { name: "react-dom", version: "^18.2.0", category: "Core" }
  ]);
  
  const [devDependencies, setDevDependencies] = useState<Dependency[]>([
    { name: "vite", version: "^4.3.0", category: "Build Tool" }
  ]);
  
  // App generation logic
  const { 
    generateApp, 
    reset,
    loadDemoApp,
    isGenerating, 
    isComplete, 
    error,
    generatedApp
  } = useAppGeneration({
    onSuccess: (data) => {
      if (data.files) {
        // Cast the files array to the correct type
        const typedFiles = data.files.map(file => ({
          ...file,
          type: file.type as "file" | "folder"
        }));
        setFiles(typedFiles);
        
        // Find a good default active file
        const indexFile = typedFiles.find(file => file.name === "index.html" || file.name === "App.jsx" || file.name === "App.js");
        if (indexFile) {
          setActiveFile(indexFile.name);
        } else if (typedFiles.length > 0 && typedFiles[0].type === "file") {
          setActiveFile(typedFiles[0].name);
        }
        
        setActiveTab("editor");
      }
      
      // Process dependencies if they exist
      const mainDeps: Dependency[] = [];
      const devDeps: Dependency[] = [];
      
      if (data.dependencies) {
        Object.entries(data.dependencies).forEach(([name, version]) => {
          let category: Dependency["category"] = "Utility";
          if (name === "react" || name === "react-dom") category = "Core";
          else if (name.includes("router")) category = "Routing";
          else if (name.includes("ui") || name.includes("component")) category = "UI";
          else if (name.includes("redux") || name.includes("state") || name.includes("store")) category = "State Management";
          else if (name.includes("chart") || name.includes("graph") || name.includes("d3")) category = "Visualization";
          
          mainDeps.push({ name, version, category });
        });
      }
      
      if (data.devDependencies) {
        Object.entries(data.devDependencies).forEach(([name, version]) => {
          let category: Dependency["category"] = "Utility";
          if (name.includes("vite") || name.includes("webpack")) category = "Build Tool";
          else if (name.includes("eslint")) category = "Linting";
          else if (name.includes("jest") || name.includes("test")) category = "Testing";
          else if (name.includes("postcss") || name.includes("autoprefixer")) category = "CSS Processing";
          
          devDeps.push({ name, version, category });
        });
      }
      
      setDependencies(mainDeps);
      setDevDependencies(devDeps);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGenerate = (promptText: string) => {
    generateApp(promptText, projectSettings);
  };

  const handleClear = () => {
    setPrompt("");
    reset();
  };

  const handleLoadExample = () => {
    setPrompt("Build me a React dashboard with a data table and chart for tracking sales data. Include filtering and sorting capabilities.");
  };
  
  // Function to load a demo app for preview
  const handleLoadErrorTest = () => {
    // Create a simple self-contained demo - using a minimal, single-file HTML app
    const demoApp: GeneratedApp = {
      files: [
        {
          name: "index.html",
          path: "/index.html",
          type: "file" as "file",
          language: "html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo Demo App</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { text-align: center; color: #333; }
    form { display: flex; margin-bottom: 20px; }
    input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #4CAF50; color: white; border: none; padding: 10px 15px; margin-left: 10px; border-radius: 4px; cursor: pointer; }
    ul { list-style-type: none; padding: 0; }
    li { display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: #f9f9f9; border-radius: 4px; }
    .completed span { text-decoration: line-through; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Todo App</h1>
    <form id="todo-form">
      <input type="text" id="todo-input" placeholder="Add a new todo...">
      <button type="submit">Add</button>
    </form>
    <ul id="todo-list">
      <li>
        <span>Click the "Add" button to create a new task</span>
        <div>
          <button onclick="alert('Task completed!')">Complete</button>
          <button onclick="alert('Task deleted!')">Delete</button>
        </div>
      </li>
    </ul>
  </div>

  <script>
    // Very simple non-reactive todo app
    document.getElementById('todo-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const input = document.getElementById('todo-input');
      const text = input.value.trim();
      
      if (text) {
        const list = document.getElementById('todo-list');
        const item = document.createElement('li');
        
        item.innerHTML = \`
          <span>\${text}</span>
          <div>
            <button onclick="this.parentNode.parentNode.classList.toggle('completed')">Complete</button>
            <button onclick="this.parentNode.parentNode.remove()">Delete</button>
          </div>
        \`;
        
        list.appendChild(item);
        input.value = '';
      }
    });
  </script>
</body>
</html>`
        }
      ],
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "vite": "^4.3.0",
        "@vitejs/plugin-react": "^3.1.0"
      },
      // Add creativity metrics for the demo app
      creativityMetrics: {
        score: 87,
        novelty: 82, 
        usefulness: 92,
        elegance: 85,
        robustness: 88,
        description: "This Todo app demonstrates a clean and effective implementation with good structure and practical functionality."
      }
    };
    
    // Use our new loadDemoApp function instead of manual state management
    loadDemoApp(demoApp);
    
    // Set the active file and tab
    setActiveFile("index.html");
    setActiveTab("preview");
    
    // Show success toast
    toast({
      title: "Demo App Loaded",
      description: "A working Todo app has been loaded for preview. Check out the creativity metrics!",
    });
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-950">
      <AppHeader />
      
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 p-4 gap-4">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">Describe Your App</h1>
          
          <PromptInput
            onGenerate={handleGenerate}
            onClear={handleClear}
            onLoadExample={handleLoadExample}
            onTestError={handleLoadErrorTest}
            isGenerating={isGenerating}
            prompt={prompt}
            setPrompt={setPrompt}
          />
          
          <ProjectSettingsComponent 
            settings={projectSettings}
            onChange={setProjectSettings}
            isComplete={isComplete}
            isError={!!error}
            errorMessage={error || undefined}
          />
          
          {isComplete && (
            <>
              <ProjectFiles 
                files={files}
                activeFile={activeFile}
                onSelectFile={setActiveFile}
              />
            </>
          )}
        </div>
        
        <div className="flex flex-col min-h-[600px] h-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <div className="flex">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "editor"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Code Editor
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "preview"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Live Preview
              </button>
              <button
                onClick={() => setActiveTab("dependencies")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "dependencies"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Dependencies
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === "editor" ? (
              <CodeEditor
                activeFile={activeFile}
                files={files}
              />
            ) : activeTab === "preview" ? (
              <LivePreview
                isGenerating={isGenerating}
                isComplete={isComplete}
                isError={!!error}
                onRegenerateClick={() => handleGenerate(prompt)}
                generatedFiles={files}
                generatedApp={generatedApp || {
                  files,
                  dependencies: Object.fromEntries(dependencies.map(d => [d.name, d.version])),
                  devDependencies: Object.fromEntries(devDependencies.map(d => [d.name, d.version])),
                }}
              />
            ) : activeTab === "dependencies" ? (
              <DependenciesView
                dependencies={dependencies}
                devDependencies={devDependencies}
              />
            ) : null}
          </div>
        </div>
      </main>
      
      <AppFooter />
      
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isGenerating} message="Generating your application..." />
    </div>
  );
}