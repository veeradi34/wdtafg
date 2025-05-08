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

  // Mock dependencies
  const [dependencies, setDependencies] = useState<Dependency[]>([
    { name: "react", version: "^18.2.0", category: "Core" },
    { name: "react-dom", version: "^18.2.0", category: "Core" },
  ]);

  const [devDependencies, setDevDependencies] = useState<Dependency[]>([
    { name: "vite", version: "^4.3.0", category: "Build Tool" },
    { name: "@vitejs/plugin-react", version: "^3.1.0", category: "Build Tool" },
  ]);

  const { 
    generateApp, 
    reset, 
    isGenerating, 
    isComplete, 
    setIsComplete, // Explicitly destructure setIsComplete 
    error 
  } = useAppGeneration({
    onSuccess: (data) => {
      toast({
        title: "App Generated Successfully",
        description: "Your application code is ready to view and download.",
      });
      
      // Process the files and convert them to our internal format
      if (data.files && Array.isArray(data.files)) {
        setFiles(data.files);
      }
      
      // Process dependencies
      const mainDeps: Dependency[] = [];
      const devDeps: Dependency[] = [];
      
      if (data.dependencies) {
        Object.entries(data.dependencies).forEach(([name, version]) => {
          let category: Dependency["category"] = "Utility";
          if (name === "react" || name === "react-dom") category = "Core";
          else if (name.includes("router")) category = "Routing";
          else if (name.includes("redux") || name.includes("zustand")) category = "State Management";
          else if (name.includes("chart") || name.includes("recharts")) category = "Visualization";
          else if (name.includes("ui") || name.includes("material")) category = "UI";
          else if (name.includes("tailwind") || name.includes("styled")) category = "Styling";
          
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
  
  // Function to load our fixed test app for demonstration
  const handleLoadErrorTest = () => {
    // Load our corrected test files for the todo app
    const newTestFiles: FileNode[] = [
      {
        name: "index.html",
        path: "/index.html",
        type: "file",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZeroCode Demo App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script src="app.js"></script>
</body>
</html>`
      },
      {
        name: "app.js",
        path: "/app.js",
        type: "file",
        language: "javascript",
        content: `// Main application file
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  const todoApp = new TodoApp();
  todoApp.render(root);
});

// TodoApp class
class TodoApp {
  constructor() {
    this.todos = [];
    this.nextId = 1;
    this.inputElement = null;
    
    // Fixed event handler with proper event parameter
    this.handleSubmit = function(event) {
      event.preventDefault();
      this.addTodo(this.getInputValue());
    }.bind(this);
  }
  
  // Fixed method to get input value
  getInputValue() {
    return this.inputElement ? this.inputElement.value : '';
  }
  
  // Fixed add todo method
  addTodo(text) {
    if (!text) return;
    
    this.todos.push({
      id: this.nextId++,
      text: text,
      completed: false
    });
    
    // Fixed to use standard array filter instead of non-existent whereNot
    const incompleteTodos = this.todos.filter(todo => !todo.completed);
    this.renderTodos();
    
    // Clear input after adding
    if (this.inputElement) {
      this.inputElement.value = '';
    }
  }
  
  render(container) {
    // Create app UI
    const appContainer = document.createElement('div');
    appContainer.className = 'todo-app';
    
    // Add heading
    const heading = document.createElement('h1');
    heading.textContent = 'Todo App';
    appContainer.appendChild(heading);
    
    // Create form
    const form = document.createElement('form');
    form.addEventListener('submit', this.handleSubmit);
    
    // Create input
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.placeholder = 'Add a new todo...';
    form.appendChild(this.inputElement);
    
    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Add';
    form.appendChild(submitButton);
    
    appContainer.appendChild(form);
    
    // Create todos container
    this.todosContainer = document.createElement('ul');
    this.todosContainer.className = 'todos-list';
    appContainer.appendChild(this.todosContainer);
    
    container.appendChild(appContainer);
    
    // Initial render
    this.renderTodos();
  }
  
  renderTodos() {
    // Fixed with null check
    if (!this.todosContainer) return;
    
    this.todosContainer.innerHTML = '';
    
    this.todos.forEach(todo => {
      const todoItem = document.createElement('li');
      todoItem.className = todo.completed ? 'todo-item completed' : 'todo-item';
      
      const todoText = document.createElement('span');
      todoText.textContent = todo.text;
      todoItem.appendChild(todoText);
      
      // Create toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = todo.completed ? 'Undo' : 'Complete';
      toggleButton.addEventListener('click', () => {
        this.toggleTodo(todo.id);
      });
      todoItem.appendChild(toggleButton);
      
      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        this.deleteTodo(todo.id);
      });
      todoItem.appendChild(deleteButton);
      
      this.todosContainer.appendChild(todoItem);
    });
  }
  
  toggleTodo(id) {
    const todo = this.todos.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.renderTodos();
    }
  }
  
  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this.renderTodos();
  }
}`
      },
      {
        name: "styles.css",
        path: "/styles.css",
        type: "file",
        language: "css",
        content: `.todo-app {
  font-family: Arial, sans-serif;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #ffffff;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  margin-bottom: 20px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #4CAF50;
}

form button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

form button:hover {
  background-color: #45a049;
}

.todos-list {
  list-style-type: none;
  padding: 0;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  transition: all 0.3s ease;
  border-left: 3px solid #4CAF50;
}

.todo-item:hover {
  transform: translateX(3px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.todo-item.completed {
  border-left-color: #888;
  opacity: 0.8;
}

.todo-item.completed span {
  text-decoration: line-through;
  color: #888;
}

.todo-item button {
  margin-left: 10px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.todo-item button:first-of-type {
  background-color: #2196F3;
  color: white;
}

.todo-item button:first-of-type:hover {
  background-color: #0b7dda;
}

.todo-item button:last-child {
  background-color: #f44336;
  color: white;
}

.todo-item button:last-child:hover {
  background-color: #d32f2f;
}`
      }
    ];
    
    // Replace the current files with our test files
    setFiles(newTestFiles);
    setActiveFile("index.html");
    setActiveTab("preview");
    
    // Reset state and prepare to load test files
    reset();
    
    // Directly set the application state to complete without making an API call
    setIsComplete(true);
    setActiveTab("preview");
    
    toast({
      title: "Demo App Loaded",
      description: "A working Todo app has been loaded for demonstration. Check the preview tab to see it in action.",
    });
  };

  const downloadZip = () => {
    toast({
      title: "Download Initiated",
      description: "Your project ZIP file is being prepared for download.",
    });
    // In a real implementation, this would trigger an API call to generate and download a ZIP
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Prompt & Controls */}
        <div 
          className="w-full md:w-1/2 xl:w-2/5 flex flex-col border-r border-gray-200 dark:border-gray-700 md:min-w-[320px] md:max-w-[800px] md:resize-x overflow-auto"
        >
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
              
              {/* Download actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-2">
                  <Button onClick={downloadZip} className="flex items-center justify-center">
                    <Download className="h-5 w-5 mr-2" />
                    <span>Download as ZIP</span>
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 flex items-center justify-center"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      <span>Deploy</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 flex items-center justify-center"
                    >
                      <Share className="h-5 w-5 mr-2" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Right Panel: Preview & Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button
              variant="ghost"
              className={`px-4 py-3 text-sm font-medium rounded-none ${
                activeTab === "editor"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("editor")}
            >
              Code Editor
            </Button>
            <Button
              variant="ghost"
              className={`px-4 py-3 text-sm font-medium rounded-none ${
                activeTab === "preview"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Live Preview
            </Button>
            <Button
              variant="ghost"
              className={`px-4 py-3 text-sm font-medium rounded-none ${
                activeTab === "dependencies"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("dependencies")}
            >
              Dependencies
            </Button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative">
            {/* Code Editor Tab */}
            {activeTab === "editor" && (
              <CodeEditor activeFile={activeFile} files={files} />
            )}
            
            {/* Preview Tab */}
            {activeTab === "preview" && (
              <LivePreview 
                isGenerating={isGenerating}
                isComplete={isComplete}
                isError={!!error}
                generatedFiles={files}
                onRegenerateClick={() => {
                  if (prompt) {
                    generateApp(prompt, projectSettings);
                  }
                }}
              />
            )}
            
            {/* Dependencies Tab */}
            {activeTab === "dependencies" && (
              <DependenciesView 
                dependencies={dependencies}
                devDependencies={devDependencies}
              />
            )}
            
            {/* Loading overlay */}
            <LoadingOverlay isVisible={isGenerating} />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}