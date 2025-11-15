import {
  DiffEditor as MonacoDiffEditor,
  type DiffOnMount,
} from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";

interface DiffEditorProps {
  original: string;
  modified: string;
  fileName: string;
  language?: string;
  onClose?: () => void;
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

export function DiffEditor({
  original,
  modified,
  fileName,
  language,
  onClose,
}: DiffEditorProps) {
  const detectedLanguage = language || detectLanguage(fileName);
  const hasChanges = original !== modified;

  const handleDiffMount: DiffOnMount = (editor, monaco) => {
    // Configure Monaco theme
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
        "diffEditor.insertedTextBackground": "#28a74520",
        "diffEditor.removedTextBackground": "#f8514950",
      },
    });
    monaco.editor.setTheme("copilot-dark");
  };

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Diff View</span>
          <span className="text-sm text-muted-foreground">{fileName}</span>
          {hasChanges ? (
            <Badge
              variant="outline"
              className="text-xs bg-blue-500/10 text-blue-600 border-blue-600/30"
            >
              Modified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              No changes
            </Badge>
          )}
        </div>

        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close Diff
          </Button>
        )}
      </div>

      {/* Diff Editor */}
      <div className="flex-1">
        <MonacoDiffEditor
          original={original}
          modified={modified}
          language={detectedLanguage}
          onMount={handleDiffMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            folding: true,
            renderWhitespace: "selection",
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            // Diff-specific options
            enableSplitViewResizing: true,
            renderIndicators: true,
            ignoreTrimWhitespace: false,
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t bg-background text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500/30 border border-red-500/50 rounded" />
          <span>Removed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/30 border border-green-500/50 rounded" />
          <span>Added</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500/30 border border-blue-500/50 rounded" />
          <span>Modified</span>
        </div>
      </div>
    </div>
  );
}
