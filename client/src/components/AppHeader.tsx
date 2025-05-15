import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, User, Plus, Book, Code } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function AppHeader() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900 border-b border-gray-800 py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo and name */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-600 text-white font-bold">
            Z
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ZeroCode</span>
          {/* Beta label removed */}
        </div>

        {/* Center actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors">
            <Code className="h-4 w-4" />
            <span>Examples</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors">
            <Book className="h-4 w-4" />
            <span>Documentation</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="relative w-8 h-8 overflow-hidden rounded-full bg-gray-800 flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <User className="h-5 w-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-gray-200" align="end">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm">user@example.com</p>
                <p className="text-xs text-gray-400 truncate">
                  Free Plan
                </p>
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">Projects</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-800 mt-2">
        <div className="flex justify-between px-4 py-2">
          <button className="text-sm text-gray-300 px-3 py-1.5 rounded hover:bg-gray-800">
            New Project
          </button>
          <button className="text-sm text-gray-300 px-3 py-1.5 rounded hover:bg-gray-800">
            Examples
          </button>
          <button className="text-sm text-gray-300 px-3 py-1.5 rounded hover:bg-gray-800">
            Docs
          </button>
        </div>
      </div>
    </header>
  );
}