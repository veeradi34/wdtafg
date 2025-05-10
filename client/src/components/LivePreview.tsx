// client/src/components/LivePreview.tsx

import { useState, useEffect, useRef } from "react";
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

interface LivePreviewProps {
  isGenerating: boolean;
  isComplete: boolean;
  isError: boolean;
  onRegenerateClick: () => void;
  generatedFiles?: FileNode[];
  generatedApp?: GeneratedApp;
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
      setPreviewErrors(prev => (prev.includes(msg) ? prev : [...prev, msg]));
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Trigger rendering when generation finishes or files change
  useEffect(() => {
    if ((isComplete || generatedFiles.some(f => f.name === "index.html")) && generatedFiles.length) {
      renderPreview(generatedFiles);
      setPreviewErrors([]);
    }
  }, [isComplete, generatedFiles]);

  function renderPreview(files: FileNode[]) {
    try {
      // 1) Clean HTML template (never use host index.html)
      const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>

  <!-- UMD React/ReactDOM -->
  <script crossorigin="anonymous" src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

  <!-- UMD React Router DOM -->
  <script crossorigin="anonymous" src="https://unpkg.com/react-router-dom@6/umd/react-router-dom.development.js"></script>

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

      // 4) Expose React, Router globals
      const runtimeHelpers = `
// ─── React hook globals ───
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const { createRoot } = ReactDOM;
// ─── React Router globals ───
const { BrowserRouter: Router, Routes, Route, Link, Navigate, useParams, useNavigate } = ReactRouterDOM;
`;

      // 5) Sanitize imports/exports & strip TS syntax
      const jsBundle = [
        runtimeHelpers,
        ...appFiles.map(f => {
          const sanitized = f.content
            .replace(/^\s*import\s.+;?$/gm, "")
            .replace(/^\s*export\s+default\s+/gm, "")
            .replace(/^\s*export\s+{\s*([^}]+)\s*};?$/gm, "")
            .replace(/!(?=\))/g, "")
            .replace(/\s+as\s+[A-Za-z0-9_<>, ]+/g, "");
          return `// ── ${f.name} ──
try {
${sanitized}
} catch(e) {
  console.error("Error in ${f.name}:", e);
}`;
        }),
      ].join("\n\n");

      // 6) Mount snippet (createRoot only once)
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

      // 7) Inject bundle + mount snippet
      htmlContent = htmlContent.replace(
        /<script\s+type="text\/babel"[^>]*id="injected-js"[^>]*>\s*<\/script>/i,
        `<script
           type="text/babel"
           id="injected-js"
           data-presets="react,typescript"
         >
${jsBundle}

${mountCode}
         </script>`
      );

      // 8) Error capture snippet
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
      setPreviewHtml(htmlContent);
      if (iframeRef.current) {
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

  if (!isComplete && generatedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900">
        <Eye className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Preview Your App</h3>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Enter a description and click “Generate App” to see it here.
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

  // Default: controls + iframe
  return (
    <div className="flex flex-col h-full overflow-hidden">
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
          <div
            className={`bg-white dark:bg-gray-800 rounded-md shadow-md flex flex-col transition-all ${
              previewSize === "desktop"
                ? "w-full h-full"
                : previewSize === "tablet"
                ? "w-[768px] h-[1024px]"
                : "w-[375px] h-[667px]"
            }`}
          >
            <iframe
              ref={iframeRef}
              title="App Preview"
              className="flex-1 w-full h-full"
            />
          </div>
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
    </div>
  );
}
