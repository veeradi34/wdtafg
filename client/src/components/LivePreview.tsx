import { useState } from "react";
import { RefreshCw, Smartphone, Tablet, Monitor, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewSizeType } from "@/lib/types";
import { Loader2, AlertCircle } from "lucide-react";

interface LivePreviewProps {
  isGenerating: boolean;
  isComplete: boolean;
  isError: boolean;
  onRegenerateClick: () => void;
}

export default function LivePreview({
  isGenerating,
  isComplete,
  isError,
  onRegenerateClick,
}: LivePreviewProps) {
  const [previewSize, setPreviewSize] = useState<PreviewSizeType>("desktop");

  // Mock dashboard content for preview
  const MockDashboard = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-primary-600 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Sales Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-primary-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="p-2 hover:bg-primary-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Dashboard content */}
      <main className="flex-1 p-4 overflow-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Sales</h3>
              <span className="text-green-500 text-xs font-semibold">+12.5%</span>
            </div>
            <p className="text-2xl font-bold mt-1">$12,890</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">New Customers</h3>
              <span className="text-green-500 text-xs font-semibold">+5.8%</span>
            </div>
            <p className="text-2xl font-bold mt-1">128</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg. Order Value</h3>
              <span className="text-red-500 text-xs font-semibold">-2.3%</span>
            </div>
            <p className="text-2xl font-bold mt-1">$124.30</p>
          </div>
        </div>
        
        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">Sales Trend</h2>
          <div className="h-64 w-full">
            {/* Placeholder for chart */}
            <div className="w-full h-full flex items-end justify-between space-x-2 p-4 border-b border-l border-gray-300 dark:border-gray-700">
              <div className="h-[20%] w-8 bg-primary-500 rounded-t"></div>
              <div className="h-[35%] w-8 bg-primary-500 rounded-t"></div>
              <div className="h-[45%] w-8 bg-primary-500 rounded-t"></div>
              <div className="h-[30%] w-8 bg-primary-500 rounded-t"></div>
              <div className="h-[60%] w-8 bg-primary-500 rounded-t"></div>
              <div className="h-[80%] w-8 bg-primary-500 rounded-t"></div>
            </div>
            <div className="flex justify-between px-4 pt-2 text-xs text-gray-500">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>
        
        {/* Data table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium">Top Products</h2>
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">WA</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">Widget A</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">123</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">$1,230</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">WB</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">Widget B</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">456</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">$4,560</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">WC</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">Widget C</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">789</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">$7,890</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Low Stock
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );

  const renderPreviewContent = () => {
    if (isComplete) {
      return <MockDashboard />;
    }

    if (isError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-red-500 mb-2">Generation Failed</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            We encountered an issue while generating your app. This could be due to:
          </p>
          <ul className="text-gray-500 dark:text-gray-400 text-sm mb-6 list-disc pl-6">
            <li>Complex or ambiguous request</li>
            <li>Server is currently experiencing high load</li>
            <li>Unsupported framework or component requirements</li>
          </ul>
          <Button onClick={onRegenerateClick}>
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
          Generate your app to see a preview
        </p>
        <Button 
          onClick={onRegenerateClick}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <span>Generate Now</span>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview controls */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <Button
            variant={previewSize === "mobile" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setPreviewSize("mobile")}
            aria-label="Mobile view"
          >
            <Smartphone className="h-5 w-5" />
          </Button>
          <Button
            variant={previewSize === "tablet" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setPreviewSize("tablet")}
            aria-label="Tablet view"
          >
            <Tablet className="h-5 w-5" />
          </Button>
          <Button
            variant={previewSize === "desktop" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setPreviewSize("desktop")}
            aria-label="Desktop view"
          >
            <Monitor className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRegenerateClick}
            aria-label="Refresh preview"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="View code">
            <Eye className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div
          className={`
            h-full bg-white dark:bg-gray-900 shadow-md transition-all duration-300 overflow-hidden
            ${
              previewSize === "mobile"
                ? "w-[320px]"
                : previewSize === "tablet"
                ? "w-[768px]"
                : "w-full max-w-[1280px]"
            }
          `}
        >
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
}
