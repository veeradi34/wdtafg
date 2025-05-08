export default function AppFooter() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-2 sm:mb-0">
          <span>© {new Date().getFullYear()} ZeroCode. All rights reserved.</span>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
          <a href="#" className="hover:text-primary transition-colors">Blog</a>
          <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
}
