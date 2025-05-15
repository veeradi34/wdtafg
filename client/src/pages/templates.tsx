import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, ArrowLeft, Search } from "lucide-react";

// Define template type
interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  popularity: number;
  tags: string[];
}

interface TemplatesComponentProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  goToHome: () => void;
  onSelectTemplate: (templateId: string) => void;
  goToDocumentation?: () => void; // Added prop for navigation
}

export default function TemplatesComponent({
  isDarkMode,
  toggleTheme,
  goToHome,
  onSelectTemplate,
  goToDocumentation
}: TemplatesComponentProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Apply a template and go back to home page
  const applyTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
  };
  
  // Popular templates data
  const templates: Template[] = [
    {
      id: "e-commerce",
      name: "E-Commerce Store",
      description: "A full-featured online store with product listings, shopping cart, and checkout flow",
      icon: "🛒",
      category: "business",
      popularity: 95,
      tags: ["business", "store", "shopping", "payments"]
    },
    {
      id: "dashboard",
      name: "Data Dashboard",
      description: "Interactive analytics dashboard with multiple charts, filterable tables, and real-time updates",
      icon: "📊",
      category: "data",
      popularity: 92,
      tags: ["data", "charts", "analytics", "dashboard"]
    },
    {
      id: "blog",
      name: "Blog Platform",
      description: "Modern blog with article listings, search, commenting system, and admin panel",
      icon: "✍️",
      category: "content",
      popularity: 88,
      tags: ["blog", "cms", "content", "writing"]
    },
    {
      id: "todo-app",
      name: "Todo App",
      description: "Task management app with categories, due dates, priorities, and drag-and-drop",
      icon: "✅",
      category: "productivity",
      popularity: 90,
      tags: ["productivity", "tasks", "organization"]
    },
    {
      id: "social-media",
      name: "Social Media App",
      description: "Social platform with news feed, user profiles, posts, and messaging",
      icon: "👥",
      category: "social",
      popularity: 87,
      tags: ["social", "messaging", "profiles", "feed"]
    },
    {
      id: "portfolio",
      name: "Portfolio Website",
      description: "Professional portfolio site to showcase your work and skills",
      icon: "💼",
      category: "personal",
      popularity: 85,
      tags: ["portfolio", "personal", "career"]
    },
    {
      id: "weather-app",
      name: "Weather App",
      description: "Weather forecast app with location search and 7-day predictions",
      icon: "🌤️",
      category: "utility",
      popularity: 82,
      tags: ["weather", "forecast", "utility"]
    },
    {
      id: "note-taking",
      name: "Note Taking App",
      description: "Note-taking application with rich text editing and organization features",
      icon: "📝",
      category: "productivity",
      popularity: 86,
      tags: ["notes", "productivity", "writing"]
    },
    {
      id: "chat-application",
      name: "Chat Application",
      description: "Real-time chat app with channels, direct messages, and file sharing",
      icon: "💬",
      category: "social",
      popularity: 84,
      tags: ["chat", "messaging", "social"]
    },
    {
      id: "calendar",
      name: "Calendar App",
      description: "Calendar application with event scheduling, reminders, and sharing",
      icon: "📅",
      category: "productivity",
      popularity: 81,
      tags: ["calendar", "scheduling", "productivity"]
    },
    {
      id: "recipe-app",
      name: "Recipe App",
      description: "Recipe collection app with search, favorites, and meal planning",
      icon: "🍳",
      category: "lifestyle",
      popularity: 79,
      tags: ["recipes", "food", "cooking"]
    },
    {
      id: "fitness-tracker",
      name: "Fitness Tracker",
      description: "Fitness tracking app with workout logging, progress charts, and goals",
      icon: "💪",
      category: "health",
      popularity: 80,
      tags: ["fitness", "health", "tracking"]
    },
  ];
  
  // Categories for filtering
  const categories = [
    { id: "all", name: "All Templates" },
    { id: "business", name: "Business" },
    { id: "productivity", name: "Productivity" },
    { id: "social", name: "Social" },
    { id: "data", name: "Data & Analytics" },
    { id: "content", name: "Content" },
    { id: "personal", name: "Personal" },
    { id: "utility", name: "Utility" },
    { id: "health", name: "Health & Fitness" },
    { id: "lifestyle", name: "Lifestyle" },
  ];

  // Filter templates based on search query and active category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      searchQuery === "" || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      activeCategory === "all" || 
      template.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort templates by popularity
  const sortedTemplates = [...filteredTemplates].sort((a, b) => b.popularity - a.popularity);
  
  // Theme-specific classes - Updated to match the image colors
  const themeClasses = isDarkMode 
    ? {
        bg: "bg-gray-950",
        border: "border-gray-800",
        text: "text-white",
        textSecondary: "text-gray-400",
        card: "bg-gray-900",
        cardHover: "hover:bg-gray-800",
        input: "bg-gray-900 border-gray-700",
        highlight: "bg-gray-800",
        button: "bg-gray-800 hover:bg-gray-700",
        buttonActive: "bg-blue-600 hover:bg-blue-700",
      }
    : {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        card: "bg-white",
        cardHover: "hover:bg-gray-50",
        input: "bg-white border-gray-300",
        highlight: "bg-gray-100",
        button: "bg-gray-100 hover:bg-gray-200",
        buttonActive: "bg-blue-500 hover:bg-blue-600",
      };

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.bg} ${themeClasses.text} transition-colors duration-200`}>
      {/* Header */}
      <header className={`${themeClasses.bg} border-b ${themeClasses.border} py-2 px-4 transition-colors duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 rounded-md w-7 h-7 flex items-center justify-center text-white font-bold">
              Z
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
              className={`text-blue-500 text-sm transition-colors duration-150 border-b border-blue-500 pb-0.5`}
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

      {/* Main Content - Updated font size */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {/* Back button and title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={goToHome}
              className={`p-1 rounded-full ${themeClasses.button} ${themeClasses.text} transition-colors duration-150`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Popular Templates</h1>
          </div>
          
          {/* Search bar */}
          <div className="relative w-1/3">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 px-3 pr-10 rounded-md text-sm ${themeClasses.input} ${themeClasses.text} focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200`}
            />
            <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textSecondary}`} />
          </div>
        </div>
        
        {/* Category filter - Made text bigger */}
        <div className="flex flex-wrap mb-6 gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-150 ${
                activeCategory === category.id
                  ? `${themeClasses.buttonActive} text-white`
                  : `${themeClasses.button} ${themeClasses.text}`
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Templates grid - Updated font sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.map(template => (
            <div 
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4 ${themeClasses.cardHover} cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 flex flex-col`}
            >
              <div className="flex items-start mb-2">
                <div className="text-3xl mr-3">{template.icon}</div>
                <div>
                  <h3 className={`font-medium text-base ${themeClasses.text}`}>{template.name}</h3>
                  <div className="flex items-center mt-1">
                    <div className="w-full bg-gray-300 rounded-full h-1.5 mr-2 dark:bg-gray-700">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${template.popularity}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-500">{template.popularity}% popular</span>
                  </div>
                </div>
              </div>
              <p className={`text-sm ${themeClasses.textSecondary} mb-3 flex-1`}>
                {template.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {template.tags.map(tag => (
                  <span key={tag} className={`text-sm px-2 py-0.5 rounded-full ${themeClasses.highlight} ${themeClasses.textSecondary}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <div className={`text-center py-10 ${themeClasses.textSecondary}`}>
            <p className="text-lg mb-2">No templates found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className={`${themeClasses.bg} border-t ${themeClasses.border} py-2 px-4 text-xs ${themeClasses.textSecondary} text-center transition-colors duration-200`}>
        ©2025 ZeroCode Labs. All Rights Reserved.
      </footer>
    </div>
  );
}