import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, ArrowLeft, Search, Coffee, FileCode, Database, Server, Layers, Code, Terminal, Shield, Play, Settings, Users, Gift } from "lucide-react";

interface DocumentationProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  goToHome: () => void;
  goToTemplates?: () => void; // Added prop for navigation
}

export default function Documentation({ isDarkMode, toggleTheme, goToHome, goToTemplates }: DocumentationProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");
  
  // Theme-specific colors - matched to the new design
  const themeClasses = isDarkMode 
    ? {
        bg: "bg-gray-950",
        cardBg: "bg-gray-900",
        border: "border-gray-800",
        text: "text-white",
        textSecondary: "text-gray-400",
        input: "bg-gray-800 border-gray-700",
        button: "bg-blue-600 hover:bg-blue-700",
        buttonSecondary: "bg-gray-800 hover:bg-gray-700",
        divider: "bg-gray-800",
        sidebar: "bg-gray-900",
        highlight: "bg-gray-800",
        activeLink: "bg-blue-900/30 text-blue-400 border-l-2 border-blue-500",
      }
    : {
        bg: "bg-gray-50",
        cardBg: "bg-white",
        border: "border-gray-200",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        input: "bg-white border-gray-300",
        button: "bg-blue-500 hover:bg-blue-600",
        buttonSecondary: "bg-gray-100 hover:bg-gray-200",
        divider: "bg-gray-200",
        sidebar: "bg-white",
        highlight: "bg-gray-100",
        activeLink: "bg-blue-50 text-blue-600 border-l-2 border-blue-500",
      };

  // Documentation sections
  const sections = [
    { id: "getting-started", name: "Getting Started", icon: Play },
    { id: "features", name: "Features", icon: Gift },
    { id: "project-structure", name: "Project Structure", icon: Layers },
    { id: "templates", name: "Templates", icon: FileCode },
    { id: "code-generation", name: "Code Generation", icon: Code },
    { id: "api-reference", name: "API Reference", icon: Server },
    { id: "database", name: "Database", icon: Database },
    { id: "cli", name: "Command Line", icon: Terminal },
    { id: "auth", name: "Authentication", icon: Shield },
    { id: "configuration", name: "Configuration", icon: Settings },
    { id: "deployment", name: "Deployment", icon: Server },
    { id: "community", name: "Community", icon: Users },
    { id: "support", name: "Support", icon: Coffee },
  ];

  // Get content for the current section
  const getSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "getting-started":
        return (
          <>
            <h1 className="text-3xl font-bold mb-6">Getting Started with ZeroCode</h1>
            <p className="mb-4">
              ZeroCode is a powerful platform that allows you to generate complete applications from natural language descriptions. 
              This guide will help you get started with creating your first application.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Quick Start</h2>
            <ol className="list-decimal pl-6 space-y-3 mb-6">
              <li>
                <strong>Navigate to the home page</strong> - Start by going to the main dashboard where you'll see the chat interface.
              </li>
              <li>
                <strong>Describe your app</strong> - In the chat interface, describe the application you want to build in detail. 
                The more specific you are, the better the generated code will match your requirements.
              </li>
              <li>
                <strong>Review the generated code</strong> - After generation, you can review the code in the built-in editor.
              </li>
              <li>
                <strong>Preview your app</strong> - Use the live preview feature to see your application in action.
              </li>
              <li>
                <strong>Export your project</strong> - When you're satisfied, export the code to continue development locally.
              </li>
            </ol>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Key Concepts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Code size={20} className="mr-2 text-blue-500" />
                  Code Generation
                </h3>
                <p className={`${themeClasses.textSecondary}`}>
                  ZeroCode uses AI to transform your descriptions into working code, supporting multiple frameworks and languages.
                </p>
              </div>
              <div className={`p-4 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FileCode size={20} className="mr-2 text-blue-500" />
                  Templates
                </h3>
                <p className={`${themeClasses.textSecondary}`}>
                  Start with pre-defined templates for common application types like e-commerce, dashboards, or blogs.
                </p>
              </div>
              <div className={`p-4 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Layers size={20} className="mr-2 text-blue-500" />
                  Project Structure
                </h3>
                <p className={`${themeClasses.textSecondary}`}>
                  ZeroCode organizes your code in a clean, maintainable structure following best practices for each framework.
                </p>
              </div>
              <div className={`p-4 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Play size={20} className="mr-2 text-blue-500" />
                  Live Preview
                </h3>
                <p className={`${themeClasses.textSecondary}`}>
                  See your application in real-time as you make changes, with support for different viewport sizes.
                </p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">System Requirements</h2>
            <ul className="list-disc pl-6 space-y-2 mb-8">
              <li>Modern web browser (Chrome, Firefox, Safari, or Edge)</li>
              <li>Internet connection</li>
              <li>For local development: Node.js 14+ and npm or yarn</li>
            </ul>
            
            <div className={`p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-8`}>
              <h3 className="text-lg font-medium mb-2 text-blue-500">Pro Tip</h3>
              <p>
                The more detailed your description, the better the results. Include information about the UI, functionality, 
                data structures, and any specific libraries or frameworks you want to use.
              </p>
            </div>
          </>
        );
      
      case "features":
        return (
          <>
            <h1 className="text-3xl font-bold mb-6">ZeroCode Features</h1>
            <p className="mb-6">
              ZeroCode comes packed with features designed to streamline the application development process.
              Here's a comprehensive overview of what you can do with our platform.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className={`p-5 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  <Code size={20} className="mr-2 text-blue-500" />
                  AI-Powered Code Generation
                </h2>
                <p className={`${themeClasses.textSecondary}`}>
                  Transform natural language descriptions into functional code across multiple languages and frameworks.
                  Our AI understands your intent and generates clean, maintainable code that follows best practices.
                </p>
              </div>
              
              <div className={`p-5 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  <Play size={20} className="mr-2 text-blue-500" />
                  Real-time Preview
                </h2>
                <p className={`${themeClasses.textSecondary}`}>
                  See your application come to life instantly with a built-in preview environment.
                  Test functionality, check responsiveness, and iterate quickly without deploying.
                </p>
              </div>
              
              <div className={`p-5 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  <FileCode size={20} className="mr-2 text-blue-500" />
                  Pre-built Templates
                </h2>
                <p className={`${themeClasses.textSecondary}`}>
                  Jump-start your development with dozens of pre-built templates for common applications.
                  From e-commerce stores to dashboards, blogs, and more—customize to your needs.
                </p>
              </div>
              
              <div className={`p-5 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  <Layers size={20} className="mr-2 text-blue-500" />
                  Integrated Editor
                </h2>
                <p className={`${themeClasses.textSecondary}`}>
                  Edit generated code directly in the browser with our powerful code editor.
                  Features syntax highlighting, auto-completion, and instant preview updates.
                </p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-10 mb-4">Framework Support</h2>
            <p className="mb-4">ZeroCode generates code for popular web frameworks and libraries:</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">React</span>
              </div>
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">Vue</span>
              </div>
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">Angular</span>
              </div>
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">Next.js</span>
              </div>
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">Express</span>
              </div>
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">Django</span>
              </div>
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">Flask</span>
              </div>
              <div className={`p-3 rounded ${themeClasses.highlight} text-center`}>
                <span className="font-medium">Ruby on Rails</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-10 mb-4">Coming Soon</h2>
            <div className={`p-4 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border} border-dashed mb-6`}>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  Collaborative editing for teams
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  CI/CD pipeline integration
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  Advanced component customization
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  API integration wizard
                </li>
              </ul>
            </div>
          </>
        );
      
      // Add more section content as needed
      default:
        return (
          <div className="py-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Documentation Coming Soon</h2>
            <p className={`${themeClasses.textSecondary} max-w-md mx-auto`}>
              This section is currently under development. Please check back soon for complete documentation on this topic.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.bg} ${themeClasses.text} transition-colors duration-200`}>
      {/* Header */}
      <header className={`${themeClasses.bg} border-b ${themeClasses.border} py-2 px-4 transition-colors duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md overflow-hidden">
              <img 
                src="/company-logo.png" 
                alt="Company Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg tracking-tight">ZeroCode</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/50 text-blue-400">
              Beta
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={goToHome} 
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
              className={`text-blue-500 text-sm transition-colors duration-150 border-b border-blue-500 pb-0.5`}
            >
              Documentation
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
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
            <div className={`w-7 h-7 ${themeClasses.highlight} rounded-full flex items-center justify-center ${themeClasses.textSecondary}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className={`w-64 ${themeClasses.sidebar} border-r ${themeClasses.border} flex flex-col overflow-auto`}>
          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2 px-3 pr-10 rounded-md text-sm ${themeClasses.input} ${themeClasses.text} focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200`}
              />
              <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textSecondary}`} />
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex-1 py-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 transition-colors duration-150 ${
                    activeSection === section.id 
                      ? themeClasses.activeLink
                      : `hover:${themeClasses.highlight} ${themeClasses.textSecondary}`
                  }`}
                >
                  <Icon size={16} />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </div>
          
          {/* Version */}
          <div className={`p-4 text-xs ${themeClasses.textSecondary} border-t ${themeClasses.border}`}>
            <div className="flex justify-between">
              <span>Documentation v1.0</span>
              <span>ZeroCode v0.9.5</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {getSectionContent(activeSection)}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={`${themeClasses.bg} border-t ${themeClasses.border} py-3 px-4 text-xs ${themeClasses.textSecondary} text-center transition-colors duration-200`}>
        ©2025 ZeroCode Labs. All Rights Reserved.
      </footer>
    </div>
  );
}