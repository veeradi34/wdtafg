import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, User } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function AppHeader() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo and name */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground font-bold">
            Z
          </div>
          <span className="text-xl font-bold tracking-tight">ZeroCode</span>
          <span className="hidden md:inline-block text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
            Beta
          </span>
        </div>

        {/* Center actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="outline" size="sm">
            New Project
          </Button>
          <Button variant="outline" size="sm">
            Examples
          </Button>
          <Button variant="outline" size="sm">
            Documentation
          </Button>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative w-8 h-8 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center hover:ring-2 hover:ring-primary transition-all"
              >
                <User className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="px-4 py-3">
                <p className="text-sm">user@example.com</p>
                <p className="text-xs text-muted-foreground truncate">
                  Free Plan
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Projects</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between px-4 py-2">
          <Button variant="outline" size="sm">
            New Project
          </Button>
          <Button variant="outline" size="sm">
            Examples
          </Button>
          <Button variant="outline" size="sm">
            Docs
          </Button>
        </div>
      </div>
    </header>
  );
}
