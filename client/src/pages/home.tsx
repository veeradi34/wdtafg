import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, RefreshCw, Plus, LogOut, User } from "lucide-react";
import { useAppGeneration } from "@/hooks/useAppGeneration";
import { 
  TabType, 
  ProjectSettings, 
  FileNode, 
  Dependency 
} from "@/lib/types";
import { GeneratedApp } from "@shared/schema";
import ChatInterface from "@/components/Chatinterface";
import ProjectFiles from "@/components/ProjectFiles";
import CodeEditor from "@/components/CodeEditor";
import LivePreview from "@/components/LivePreview";
import DependenciesView from "@/components/DependenciesView";
import CreativityMeter from "@/components/CreativityMeter";
import TemplatesComponent from "./templates";
import Documentation from "./Documentation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { v4 as uuidv4 } from 'uuid';

// Add onLogout prop to the Home component
interface HomeProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  onLogout?: () => void; // Optional logout handler
}

// Default files structure
const DEFAULT_FILES: FileNode[] = [
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
];

// Default dependencies
const DEFAULT_DEPENDENCIES: Dependency[] = [
  { name: "react", version: "^18.2.0", category: "Core" },
  { name: "react-dom", version: "^18.2.0", category: "Core" }
];

const DEFAULT_DEV_DEPENDENCIES: Dependency[] = [
  { name: "vite", version: "^4.3.0", category: "Build Tool" }
];

export default function Home({ isDarkMode: propIsDarkMode, toggleTheme: propToggleTheme, onLogout }: HomeProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [activeFile, setActiveFile] = useState("App.jsx");
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode !== undefined ? propIsDarkMode : true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [chatKey, setChatKey] = useState(0); // Use to force re-render of ChatInterface
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    framework: "React",
    styling: "Tailwind CSS",
    stateManagement: "React Hooks",
    buildTool: "Vite",
  });
  
  // State for resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Equal split (50%)
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState([
    {
      id: uuidv4(),
      content: "What kind of app would you like me to build?",
      sender: "system",
      timestamp: new Date(),
    },
  ]);

  // Apply theme changes to body
  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDarkMode);
    document.body.classList.toggle('light-theme', !isDarkMode);
    // Also add a data attribute for other components to use
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  // Handle template selection
  useEffect(() => {
    if (selectedTemplate) {
      const templatePrompt = getTemplatePrompt(selectedTemplate);
      if (templatePrompt) {
        setPrompt(templatePrompt);
        console.log(`Template selected: ${selectedTemplate}`);
        console.log(`Prompt: ${templatePrompt}`);
        
        // Ensure we trigger generation with a slight delay to allow state updates
        setTimeout(() => {
          handleGenerate(templatePrompt);
          
          // Show notification
          toast({
            title: "Template Selected",
            description: `Creating a ${selectedTemplate.replace('-', ' ')} application.`,
            duration: 3000,
          });
        }, 100);
        
        // Clear the selected template
        setSelectedTemplate(null);
      }
    }
  }, [selectedTemplate]);

  // Handle resize functionality with improved smoothness
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;
    document.body.style.cursor = 'col-resize';
    
    // Add an overlay to make dragging smoother
    const overlay = document.createElement('div');
    overlay.id = 'resize-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '1000';
    overlay.style.cursor = 'col-resize';
    document.body.appendChild(overlay);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    requestAnimationFrame(() => {
      const containerWidth = contentRef.current?.offsetWidth || 1000;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(Math.max(startWidthRef.current + (delta / containerWidth) * 100, 30), 70);
      setLeftPanelWidth(newWidth);
    });
  };

  const stopResize = () => {
    resizingRef.current = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
    
    // Remove the overlay
    const overlay = document.getElementById('resize-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  };

  // Handle theme toggle - use prop function if provided, otherwise use internal state
  const toggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      setIsDarkMode(prev => !prev);
      
      // Show toast for user feedback
      toast({
        title: `Switched to ${!isDarkMode ? 'Dark' : 'Light'} Mode`,
        description: `The interface is now in ${!isDarkMode ? 'dark' : 'light'} mode.`,
        duration: 2000,
      });
    }
  };
  
  // Files and dependencies state
  const [files, setFiles] = useState<FileNode[]>(DEFAULT_FILES);
  const [dependencies, setDependencies] = useState<Dependency[]>(DEFAULT_DEPENDENCIES);
  const [devDependencies, setDevDependencies] = useState<Dependency[]>(DEFAULT_DEV_DEPENDENCIES);
  
  // Handle "New Project" button - Reset everything
  const handleNewProject = () => {
    // Reset state to defaults
    setPrompt("");
    setFiles([...DEFAULT_FILES]);
    setDependencies([...DEFAULT_DEPENDENCIES]);
    setDevDependencies([...DEFAULT_DEV_DEPENDENCIES]);
    setActiveFile("App.jsx");
    setActiveTab("preview");
    
    // Reset app generation state
    reset();
    
    // Reset chat interface by incrementing the key
    setChatKey(prev => prev + 1);
    
    // Show notification
    toast({
      title: "New Project Started",
      description: "Enter a description to generate your app.",
      duration: 3000,
    });
  };
  
  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      // Show confirmation toast
      toast({
        title: "Logging out",
        description: "You will be redirected to the login screen",
        duration: 1500,
      });
      
      // Short delay to show toast before logout
      setTimeout(() => {
        onLogout();
      }, 500);
    }
  };
  
  // Navigate to templates page
  const goToTemplates = () => {
    setShowTemplates(true);
    setShowDocumentation(false);
  };
  
  // Navigate to documentation
  const goToDocumentation = () => {
    setShowDocumentation(true);
    setShowTemplates(false);
  };
  
  // Go back to home
  const goToHome = () => {
    setShowTemplates(false);
    setShowDocumentation(false);
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    console.log(`Template selected: ${templateId}`);
    setSelectedTemplate(templateId);
    setShowTemplates(false);
  };
  
  // Get template prompt based on template ID
  const getTemplatePrompt = (templateId: string): string => {
    const templates: Record<string, string> = {
      'e-commerce': 'Create an e-commerce app with product listings, shopping cart, and checkout flow. Include user authentication and payment processing. The app should have a home page with featured products, product detail pages, shopping cart, and checkout process. Use React for the frontend and handle state management efficiently.',
      'dashboard': 'Build me a data dashboard with multiple charts, filterable tables, and a sidebar navigation. The dashboard should support real-time updates. Include line charts, bar charts, and data tables with sorting and filtering capabilities. The dashboard should have a responsive layout and dark mode support.',
      'blog': 'Generate a blog application with article listings, search functionality, and a commenting system. Include an admin panel for creating and editing posts. The blog should have a clean, modern design with categories, tags, and featured posts. Include user authentication for commenting.',
      'todo-app': 'Create a modern todo app with task categories, due dates, and priority levels. Include drag and drop reordering and dark mode support. The app should allow users to create, edit, delete, and mark tasks as complete. Implement filters for showing active, completed, or all tasks.',
      'social-media': 'Build a social media app with a news feed, user profiles, and the ability to create posts with images. Include a direct messaging feature. The app should have a responsive design and support user authentication. Implement likes, comments, and sharing for posts.',
      'portfolio': 'Create a professional portfolio website with a home page, about section, projects showcase, skills section, and contact form. The design should be modern, responsive, and customizable. Include smooth scrolling and animations for a polished user experience.',
      'weather-app': 'Build a weather forecast application with current conditions and 7-day predictions. Include location search functionality, temperature display in both Celsius and Fahrenheit, and weather icons. The app should have a clean, intuitive interface with responsive design.',
      'note-taking': 'Develop a note-taking application with rich text editing, organization features, and search functionality. Allow users to create, edit, and delete notes. Implement categories or tags for organization and a responsive design that works on all devices.',
      'chat-application': 'Create a real-time chat application with channels, direct messages, and file sharing capabilities. Implement user authentication and online status indicators. The app should have a responsive design with support for emoji reactions and message threading.',
      'calendar': 'Build a calendar application with event scheduling, reminders, and sharing features. Allow users to create, edit, and delete events with custom colors. Implement different views (day, week, month) and recurring event support.',
      'recipe-app': 'Develop a recipe collection app with search, favorites, and meal planning features. Include detailed recipe views with ingredients, instructions, and nutrition information. Implement a responsive design with filtering options for dietary restrictions.',
      'fitness-tracker': 'Create a fitness tracking app with workout logging, progress charts, and goal setting. Allow users to track different types of exercises, set personal records, and view progress over time. Implement a responsive design with visualization of fitness data.',
    };
    
    // If template ID doesn't exist, use a default prompt
    if (!templates[templateId]) {
      console.warn(`No prompt found for template ID: ${templateId}. Using default prompt.`);
      return 'Create a React web application with a modern, responsive design using best practices for state management, routing, and component structure. The app should have a clean UI with intuitive navigation.';
    }
    
    return templates[templateId];
  };
  
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
      const filesArr: FileNode[] = (((data as any).generated_files) || data.files) as FileNode[];
      if (filesArr) {
        setFiles(filesArr);
        const indexFile = filesArr.find((file: FileNode) => file.name === "index.html" || file.name === "App.jsx" || file.name === "App.js");
        if (indexFile) {
          setActiveFile(indexFile.name);
        } else if (filesArr.length > 0 && filesArr[0].type === "file") {
          setActiveFile(filesArr[0].name);
        }
        setActiveTab("editor");
      }
      
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

      // Add the system message from the backend after app generation
      if (data.conversationMessage) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: data.conversationMessage,
            sender: "system",
            timestamp: new Date(),
          },
        ]);
      }
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
    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        content: promptText,
        sender: "user",
        timestamp: new Date(),
      },
    ]);
    generateApp(promptText, projectSettings);
  };

  const handleClearChat = () => {
    setPrompt("");
    setChatMessages([
      {
        id: uuidv4(),
        content: "What kind of app would you like me to build?",
        sender: "system",
        timestamp: new Date(),
      },
    ]);
    setChatKey((prev) => prev + 1);
    toast({
      title: "Chat Cleared",
      description: "Chat history has been cleared.",
      duration: 2000,
    });
  };

  // Theme classes - adjusted to match the reference image better
  const themeClasses = isDarkMode 
    ? {
        bg: "bg-gray-950", // Darker background
        border: "border-gray-800",
        text: "text-white",
        textSecondary: "text-gray-400",
        sidebar: "bg-gray-950",
        input: "bg-gray-900",
        card: "bg-gray-900",
        highlight: "bg-gray-800",
        preview: "bg-gray-950",
        activeButton: "bg-blue-600 text-white",
      }
    : {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        sidebar: "bg-white",
        input: "bg-white",
        card: "bg-white",
        highlight: "bg-gray-100",
        preview: "bg-white",
        activeButton: "bg-blue-500 text-white",
      };

  // If templates view is active, show templates page
  if (showTemplates) {
    return (
      <TemplatesComponent 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        goToHome={goToHome}
        onSelectTemplate={handleTemplateSelect}
        goToDocumentation={goToDocumentation}
      />
    );
  }

  // If documentation view is active, show documentation page
  if (showDocumentation) {
    return (
      <Documentation
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        goToHome={goToHome}
        goToTemplates={goToTemplates}
      />
    );
  }

  // Otherwise show home page
  return (
    <div className={`h-screen flex flex-col ${themeClasses.bg} ${themeClasses.text} overflow-hidden transition-colors duration-200`}>
      {/* Top Navigation Bar - Compact */}
      <header className={`${themeClasses.bg} border-b ${themeClasses.border} py-2 px-4 transition-colors duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Company logo */}
            <div className="w-7 h-7 rounded-md overflow-hidden">
              <img 
                src="/company-logo.png" 
                alt="Company Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg tracking-tight">ZeroCode</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={handleNewProject} 
              className={`${themeClasses.textSecondary} hover:${themeClasses.text} text-sm transition-colors duration-150`}
            >
              Create New Project
            </button>
            <button 
              onClick={goToTemplates} 
              className={`${themeClasses.textSecondary} hover:${themeClasses.text} text-sm transition-colors duration-150`}
            >
              Templates
            </button>
            <button 
              onClick={goToDocumentation} 
              className={`${themeClasses.textSecondary} hover:${themeClasses.text} text-sm transition-colors duration-150`}
            >
              Documentation
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Theme toggle button */}
            <button 
              onClick={toggleTheme}
              className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors rounded-full hover:bg-opacity-10 hover:bg-gray-500`}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            {/* Clear logout button with text label for visibility */}
            {onLogout && (
              <button 
                onClick={handleLogout}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm transition-colors duration-150`}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>Logout</span>
              </button>
            )}
            
            {/* Keep user icon for consistency with design */}
            <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button 
      className={`w-7 h-7 ${themeClasses.highlight} rounded-full flex items-center justify-center ${themeClasses.textSecondary}`}
      aria-label="User menu"
    >
      <User className="h-4 w-4" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className={`${themeClasses.card} border ${themeClasses.border}`}>
    <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
    <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleLogout}>
      Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
          </div>
        </div>
      </header>

      <div id="main-container" ref={contentRef} className="flex flex-1 overflow-hidden">
        {/* Left panel for chat interface */}
        <div 
          className={`h-full overflow-hidden flex flex-col ${themeClasses.bg} transition-colors duration-200 border-r ${themeClasses.border}`}
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Add a "New Chat" button above chat interface */}
          <div className={`flex items-center px-4 py-2 ${themeClasses.bg} ${themeClasses.border} border-b`}>
            <button 
              onClick={handleNewProject}
              className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-md flex items-center space-x-1 text-xs transition-colors duration-150"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          </div>
          
          <ChatInterface
            key={`chat-${chatKey}`}
            onGenerate={handleGenerate}
            onClear={handleClearChat}
            isGenerating={isGenerating}
            prompt={prompt}
            setPrompt={setPrompt}
            isDarkMode={isDarkMode}
            messages={chatMessages}
            setMessages={setChatMessages}
          />
        </div>
            
        {/* Resize handle */}
        <div 
          className={`w-1 ${isDarkMode ? 'bg-gray-800 hover:bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'} cursor-col-resize z-10 hover:w-1.5 transition-all duration-150 ease-in-out`}
          onMouseDown={startResize}
        ></div>
            
        {/* Right panel for preview and editor */}
        <div 
          className={`h-full flex flex-col overflow-hidden transition-colors duration-200`}
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Tabs */}
          <div className={`flex items-center border-b ${themeClasses.border} px-4 ${themeClasses.bg} h-10 transition-colors duration-200`}>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 text-sm border-b-2 transition-colors duration-150 ${
                activeTab === "preview"
                  ? "border-blue-500 text-blue-500"
                  : `border-transparent ${themeClasses.textSecondary} hover:text-gray-200`
              }`}
            >
              Live Preview
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-3 py-1.5 text-sm border-b-2 transition-colors duration-150 ${
                activeTab === "editor"
                  ? "border-blue-500 text-blue-500"
                  : `border-transparent ${themeClasses.textSecondary} hover:text-gray-200`
              }`}
            >
              Code Editor
            </button>
            
            {/* Refresh Button */}
            <button
              className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Refresh preview"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === "editor" && files && files.length > 0 && (
              <div className="flex h-full">
                <div className={`w-56 border-r ${themeClasses.border} ${themeClasses.sidebar} overflow-auto transition-colors duration-200`}>
                  <ProjectFiles
                    files={files}
                    activeFile={activeFile}
                    onSelectFile={(filename) => setActiveFile(filename)}
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    files={files}
                    activeFile={activeFile}
                  />
                </div>
              </div>
            )}
            
            {activeTab === "preview" && (
              <div className={`h-full ${themeClasses.preview} transition-colors duration-200`}>
                <LivePreview
                  isGenerating={isGenerating}
                  isComplete={isComplete}
                  isError={!!error}
                  onRegenerateClick={() => handleGenerate(prompt)}
                  generatedFiles={files}
                  generatedApp={generatedApp ?? undefined}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={`${themeClasses.bg} border-t ${themeClasses.border} py-2 px-4 text-xs ${themeClasses.textSecondary} text-center transition-colors duration-200`}>
        ©2025 ZeroCode Labs. All Rights Reserved.
      </footer>
    </div>
  );
}