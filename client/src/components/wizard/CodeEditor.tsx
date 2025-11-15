import { Editor, type OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface CodeEditorProps {
  value: string;
  language: string;
  readonly?: boolean;
  onChange?: (value: string) => void;
  fileName?: string;
}

function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    txt: "plaintext",
    html: "html",
    css: "css",
    scss: "scss",
    sh: "shell",
    env: "plaintext",
  };
  return langMap[ext || ""] || "plaintext";
}

export function CodeEditor({
  value,
  language,
  readonly = true,
  onChange,
  fileName,
}: CodeEditorProps) {
  const [editor, setEditor] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const detectedLanguage = fileName ? detectLanguage(fileName) : language;

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setEditor(editor);

    // Configure Monaco
    monaco.editor.defineTheme("copilot-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#c9d1d9",
        "editor.lineHighlightBackground": "#161b22",
        "editorCursor.foreground": "#58a6ff",
        "editor.selectionBackground": "#1f6feb50",
      },
    });
    monaco.editor.setTheme("copilot-dark");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "file.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {fileName || "Untitled"}
          </span>
          {!readonly && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              Editing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          value={value}
          language={detectedLanguage}
          onChange={(value) => onChange?.(value || "")}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
          options={{
            readOnly: readonly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>
    </div>
  );
}
