import { Editor, type OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { editor } from "monaco-editor";

export interface EditorDiagnostic {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info";
  source?: string;
}

interface CodeEditorProps {
  value: string;
  language: string;
  readonly?: boolean;
  onChange?: (value: string) => void;
  fileName?: string;
  diagnostics?: EditorDiagnostic[];
  onSave?: () => void;
  showSaveIndicator?: boolean;
  isDirty?: boolean;
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
  diagnostics = [],
  onSave,
  showSaveIndicator = false,
  isDirty = false,
}: CodeEditorProps) {
  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  const detectedLanguage = fileName ? detectLanguage(fileName) : language;

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    setEditorInstance(editor);
    setMonaco(monacoInstance);

    // Configure Monaco theme
    monacoInstance.editor.defineTheme("copilot-dark", {
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
    monacoInstance.editor.setTheme("copilot-dark");

    // Add save keyboard shortcut (Ctrl+S / Cmd+S)
    if (onSave && !readonly) {
      editor.addCommand(
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
        () => {
          onSave();
        }
      );
    }
  };

  // Update editor markers when diagnostics change
  useEffect(() => {
    if (!monaco || !editorInstance || !fileName) return;

    const model = editorInstance.getModel();
    if (!model) return;

    // Convert diagnostics to Monaco markers
    const markers: editor.IMarkerData[] = diagnostics.map((diag) => {
      let severity = monaco.MarkerSeverity.Error;
      if (diag.severity === "warning") severity = monaco.MarkerSeverity.Warning;
      if (diag.severity === "info") severity = monaco.MarkerSeverity.Info;

      return {
        severity,
        startLineNumber: diag.line,
        startColumn: diag.column,
        endLineNumber: diag.line,
        endColumn: diag.column + 1,
        message: diag.message,
        source: diag.source || "validation",
      };
    });

    // Set markers on model
    monaco.editor.setModelMarkers(model, "validation", markers);

    // Count errors and warnings
    const errors = diagnostics.filter((d) => d.severity === "error").length;
    const warnings = diagnostics.filter((d) => d.severity === "warning").length;
    setErrorCount(errors);
    setWarningCount(warnings);
  }, [diagnostics, monaco, editorInstance, fileName]);

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
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {fileName || "Untitled"}
          </span>

          {/* Status badges */}
          <div className="flex items-center gap-2">
            {!readonly && isDirty && (
              <Badge
                variant="outline"
                className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-600/30"
              >
                Modified
              </Badge>
            )}
            {!readonly && showSaveIndicator && !isDirty && (
              <Badge
                variant="outline"
                className="text-xs bg-green-500/10 text-green-600 border-green-600/30"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
            {readonly && (
              <Badge variant="outline" className="text-xs">
                Read-only
              </Badge>
            )}
          </div>

          {/* Diagnostic counts */}
          {diagnostics.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errorCount} {errorCount === 1 ? "error" : "errors"}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-600/30"
                >
                  {warningCount} {warningCount === 1 ? "warning" : "warnings"}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readonly && onSave && (
            <span className="text-xs text-muted-foreground mr-2">
              Press Ctrl+S to save
            </span>
          )}
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
            // Enable IntelliSense features
            quickSuggestions: !readonly,
            suggestOnTriggerCharacters: !readonly,
            acceptSuggestionOnEnter: !readonly ? "on" : "off",
            tabCompletion: !readonly ? "on" : "off",
            wordBasedSuggestions: "off",
            // Enable error squiggles
            renderValidationDecorations: "on",
          }}
        />
      </div>
    </div>
  );
}
