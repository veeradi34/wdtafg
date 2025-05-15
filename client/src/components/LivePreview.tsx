// client/src/components/LivePreview.tsx

import { useState, useEffect, useRef, ReactNode } from "react";
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CreativityMeter from "@/components/CreativityMeter";
import { PreviewSizeType, FileNode } from "@/lib/types";
import { GeneratedApp } from "@shared/schema";
import React from "react";

interface LivePreviewProps {
  isGenerating: boolean;
  isComplete: boolean;
  isError: boolean;
  onRegenerateClick: () => void;
  generatedFiles?: FileNode[];
  generatedApp?: GeneratedApp;
}

// ErrorBoundary component
class ErrorBoundary extends React.Component<{ children: ReactNode, onReset?: () => void }, { hasError: boolean, error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    // Optionally log error
    // console.error('ErrorBoundary caught:', error, info);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Preview Error</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
            {this.state.error?.message || "Something went wrong rendering the preview."}
          </p>
          <Button onClick={this.handleReset} className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LivePreview({
  isGenerating,
  isComplete,
  isError,
  onRegenerateClick,
  generatedFiles = [],
  generatedApp,
}: LivePreviewProps) {
  const [previewSize, setPreviewSize] = useState<PreviewSizeType>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [fixing, setFixing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [files, setFiles] = useState<FileNode[]>(generatedFiles);

  // Sync files state with generatedFiles prop
  useEffect(() => {
    setFiles(generatedFiles);
  }, [generatedFiles]);

  // Listen for errors posted from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || (e.data.type !== "preview-error" && e.data.type !== "preview-console-error")) {
        return;
      }
      let msg = "";
      if (e.data.type === "preview-error") {
        const p = e.data.payload;
        msg = `Error: ${p.message} at ${p.lineno}:${p.colno}\nStack: ${p.stack || "n/a"}`;
      } else {
        msg = `Console Error: ${e.data.payload.join(" ")}`;
      }
      console.log('[LivePreview] Error posted from iframe:', msg);
      setPreviewErrors(prev => (prev.includes(msg) ? prev : [...prev, msg]));
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Auto-debug loop: when previewErrors change, try to fix if not already fixing and under retry limit
  useEffect(() => {
    if (
      previewErrors.length > 0 &&
      !fixing &&
      retryCount < MAX_RETRIES &&
      files.length > 0
    ) {
      console.log('[LivePreview] Triggering auto-debug loop', { previewErrors, retryCount });
      setFixing(true);
      (async () => {
        try {
          const res = await fetch("http://localhost:5001/api/fix-errors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              errors: previewErrors,
              files,
              framework: "React",
              livePreviewError: previewErrors.join("\n"),
            }),
          });
          const data = await res.json();
          console.log('[LivePreview] /api/fix-errors response:', data);
          if (data.success && data.files) {
            setFiles(data.files);
            setPreviewErrors([]); // Clear errors to trigger re-render
            setRetryCount(retryCount + 1);
          } else {
            // If fix failed, show error but don't retry further
            setRetryCount(MAX_RETRIES);
          }
        } catch (err) {
          console.error('[LivePreview] Error in auto-debug loop:', err);
          setRetryCount(MAX_RETRIES);
        } finally {
          setFixing(false);
        }
      })();
    }
  }, [previewErrors, fixing, retryCount, files]);

  // Trigger rendering when generation finishes or files change
  useEffect(() => {
    if ((isComplete || files.some(f => f.name === "index.html")) && files.length) {
      renderPreview(files);
      setPreviewErrors([]);
    }
  }, [isComplete, files]);

  function renderPreview(files: FileNode[]) {
    try {
      console.log('[LivePreview] renderPreview called with files:', files.map(f => f.name));
      // 1) Clean HTML template (never use host index.html)
      const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>

  <!-- UMD React/ReactDOM -->
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>

  <!-- UMD React Router DOM (v5.3.4) -->
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-router-dom@5.3.4/umd/react-router-dom.min.js"></script>

  <!-- Babel standalone -->
  <script crossorigin="anonymous" src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- Stub Vite Fast-Refresh preamble -->
  <script type="module">
    import RefreshRuntime from "/@react-refresh";
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (t) => t;
    window.__vite_plugin_react_preamble_installed__ = true;
  </script>

  <style id="injected-css"></style>
</head>
<body>
  <div id="root"></div>

  <!-- bundle + mount will be injected here -->
  <script
    type="text/babel"
    id="injected-js"
    data-presets="react,typescript"
  ></script>
</body>
</html>`;

      let htmlContent = defaultHtml;

      // 2) Bundle all CSS
      const cssBundle = files
        .filter(f => f.name.endsWith(".css") && f.content)
        .map(f => `/* ${f.name} */\n${f.content}`)
        .join("\n\n");
      if (cssBundle) {
        htmlContent = htmlContent.replace(
          /<\/head>/i,
          `<style>${cssBundle}</style></head>`
        );
      }

      // 3) Filter to app JS/TSX files (exclude all *.config.js/ts)
      const appFiles = files.filter(
        (f): f is FileNode & { content: string } =>
          f.type === "file" &&
          typeof f.content === "string" &&
          /\.(js|jsx|ts|tsx)$/.test(f.name) &&
          !/\.config\.(js|ts)$/i.test(f.name)
      );
      console.log('[LivePreview] JS/TSX files for preview:', appFiles.map(f => f.name));

      // 5) Expose React, Router globals
      const runtimeHelpers = `
// ─── React hook globals ───
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const { createRoot } = ReactDOM;
// ─── React Router globals ───
const { BrowserRouter: Router, Switch, Routes, Route, Link, Navigate, useParams, useNavigate } = ReactRouterDOM;
`;

      // 6) Sanitize imports/exports & strip TS syntax
      const jsBundle = [
        runtimeHelpers,
        ...appFiles.map(f => {
          // Extract the component name from the file name (e.g., App.js -> App)
          const componentName = f.name.replace(/\..*$/, "");
          const sanitized = f.content
            .replace(/```[a-z]*\n?/gi, '') // Remove ```jsx or ```js or ```
            .replace(/```/g, '')            // Remove closing ```
            .replace(/^\s*import\s.+;?$/gm, "")
            .replace(/^\s*export\s+default\s+/gm, "")
            .replace(/^\s*export\s+{\s*([^}]+)\s*};?$/gm, "")
            .replace(/!(?=\))/g, "")
            .replace(/\s+as\s+[A-Za-z0-9_<>, ]+/g, "")
            .replace(/^\s*<\s*$/gm, ''); // Remove stray '<' on its own line
          // After the component definition, assign it to window
          return `// ── ${f.name} ──\ntry {\n${sanitized}\nwindow.${componentName} = ${componentName};\n} catch(e) {\n  console.error("Error in ${f.name}:", e);\n}`;
        })
      ].join("\n\n");
      // Optionally log the JS bundle for debugging
      console.log('[LivePreview] Final JS bundle for iframe:', jsBundle);

      // 7) Mount snippet (createRoot only once)
      const mountCode = `
// ─── Mount App ───
if (!window.__zcRoot) {
  window.__zcRoot = ReactDOM.createRoot(
    document.getElementById("root")
  );
}
window.__zcRoot.render(
  React.createElement(App)
);
`;

      // 8) Inject bundle + mount snippet
      htmlContent = htmlContent.replace(
        /<script\s+type="text\/babel"[^>]*id="injected-js"[^>]*>\s*<\/script>/i,
        `<script type="text/babel" id="injected-js" data-presets="react,typescript">\n${jsBundle}\n${mountCode}\n</script>`
      );

      const errorCapture = `<script>
window.onerror = function(message, source, lineno, colno, err) {
  parent.postMessage({
    type: 'preview-error',
    payload: { message, lineno, colno, stack: err?.stack }
  }, '*');
};
const origErr = console.error;
console.error = function(...args) {
  parent.postMessage({
    type: 'preview-console-error',
    payload: args.map(String)
  }, '*');
  origErr(...args);
};
</script>`;

      htmlContent = htmlContent.replace(/<body>/i, `<body>${errorCapture}`);

      // 9) Render into iframe via srcdoc
      console.log('[LivePreview] Final HTML content for iframe:', htmlContent);
      setPreviewHtml(htmlContent);
      if (iframeRef.current) {
        console.log('[LivePreview] Setting iframe srcdoc');
        iframeRef.current.srcdoc = htmlContent;
      }
    } catch (e) {
      console.error("Error generating preview:", e);
    }
  }

  // ===== UI for different states =====

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Generating Your App</h3>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Please wait while we build your preview…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Generation Failed</h3>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
          Something went wrong. Try again with a different prompt.
        </p>
        <Button onClick={onRegenerateClick} className="flex items-center">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  if (!isComplete && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900">
        <Eye className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Preview Your App</h3>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Enter a description and click "Generate App" to see it here.
        </p>
      </div>
    );
  }

  if (previewErrors.length > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-500">
              Preview Errors ({previewErrors.length})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewErrors([])}
            className="text-red-500 border-red-200 hover:border-red-300"
          >
            Clear Errors
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-red-50 dark:bg-red-900/10">
          {previewErrors.map((err, i) => (
            <pre
              key={i}
              className="mb-4 p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-500"
            >
              {err}
            </pre>
          ))}
        </div>
      </div>
    );
  }

  if (fixing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Debugging & Fixing Errors</h3>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Attempting to auto-fix errors in your app preview…
        </p>
      </div>
    );
  }

  // Default: controls + iframe with mock device frames
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ErrorBoundary>
        <div className="flex justify-between items-center p-2 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button
              size="icon"
              variant={previewSize === "mobile" ? "default" : "outline"}
              onClick={() => setPreviewSize("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={previewSize === "tablet" ? "default" : "outline"}
              onClick={() => setPreviewSize("tablet")}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={previewSize === "desktop" ? "default" : "outline"}
              onClick={() => setPreviewSize("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (iframeRef.current) {
                try {
                  iframeRef.current.contentWindow?.location.reload();
                } catch {
                  iframeRef.current.contentDocument?.open();
                  iframeRef.current.contentDocument?.write(previewHtml);
                  iframeRef.current.contentDocument?.close();
                }
              }
            }}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
        <div className="flex-1 flex bg-gray-100 dark:bg-gray-900 p-4 overflow-hidden">
          <div className="flex-1 flex justify-center items-start overflow-auto">
            {previewSize === "mobile" ? (
              <div className="relative bg-black rounded-[36px] shadow-xl border-8 border-black h-[600px] w-[320px] overflow-hidden">
                {/* Notch for mobile device */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-black z-10 rounded-b-lg"></div>
                {/* Power button */}
                <div className="absolute right-[-8px] top-20 w-2 h-12 bg-gray-700 rounded-r-md"></div>
                {/* Volume buttons */}
                <div className="absolute left-[-8px] top-16 w-2 h-8 bg-gray-700 rounded-l-md"></div>
                <div className="absolute left-[-8px] top-28 w-2 h-8 bg-gray-700 rounded-l-md"></div>
                <div className="absolute left-[-8px] top-28 w-2 h-8 bg-gray-700 rounded-l-md"></div>
                <iframe
                  ref={iframeRef}
                  title="Mobile App Preview"
                  className="w-full h-full bg-white"
                />
              </div>
            ) : previewSize === "tablet" ? (
              <div className="relative bg-black rounded-[24px] shadow-xl border-[12px] border-black h-[800px] w-[600px] overflow-hidden">
                {/* Camera for tablet */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full z-10"></div>
                {/* Power button */}
                <div className="absolute right-[-12px] top-24 w-3 h-14 bg-gray-700 rounded-r-md"></div>
                {/* Volume buttons */}
                <div className="absolute top-[-12px] right-24 h-3 w-14 bg-gray-700 rounded-t-md"></div>
                <iframe
                  ref={iframeRef}
                  title="Tablet App Preview"
                  className="w-full h-full bg-white"
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-md shadow-md flex flex-col w-full h-full overflow-hidden">
                {/* Desktop browser chrome */}
                <div className="bg-gray-200 dark:bg-gray-700 h-7 flex items-center px-2 border-b border-gray-300 dark:border-gray-600">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto bg-white dark:bg-gray-800 rounded-sm px-3 py-0.5 text-xs text-gray-600 dark:text-gray-300 flex items-center">
                    <div className="mr-1 w-3 h-3 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>preview.zerocode.app</span>
                  </div>
                </div>
                <iframe
                  ref={iframeRef}
                  title="Desktop App Preview"
                  className="flex-1 w-full"
                />
              </div>
            )}
          </div>
          {isComplete && generatedApp && (
            <div className="w-72 ml-4 overflow-auto">
              <CreativityMeter
                metrics={generatedApp.creativityMetrics}
                isLoading={!generatedApp.creativityMetrics}
              />
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}