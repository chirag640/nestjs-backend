# Sprint 7 Quick Reference

## 🎯 User Guide

### Accessing the Editor

1. Complete Steps 1-6 in the wizard
2. Click "Continue" on Step 6 (Review)
3. Wait for project generation (~5-10 seconds)
4. Step 7 opens with file preview

### Enabling Edit Mode

```
Click "Edit Mode" button in top-right corner
```

**What happens:**

- Monaco editor becomes editable
- Toolbar shows additional buttons
- Keyboard shortcuts activated

### Making Edits

1. **Select file** from tree on left
2. **Edit content** in Monaco editor
3. **Save**: Press `Ctrl+S` or click "Save" button
4. **Yellow "Modified" badge** appears until saved

### Formatting Code

```
Click "Format" button
```

- Uses Prettier
- Works on: TypeScript, JavaScript, JSON
- ~1-2 seconds for typical file

### Running Validations

#### ESLint (Code Quality)

```
Click "Lint" button
```

- Shows errors/warnings inline
- Badge displays count
- ~2-3 seconds for typical file

#### TypeScript (Type Checking)

```
Click "Typecheck" button
```

- Validates entire project
- Shows errors for current file
- ~5-10 seconds for typical project

#### Auto-Fix (Combined)

```
Click "Auto-Fix" button
```

- Runs ESLint auto-fix
- Runs Prettier format
- ~3-5 seconds total

### Undo/Redo

```
Undo: Click ↶ button (or Ctrl+Z in editor)
Redo: Click ↷ button (or Ctrl+Y in editor)
```

- 50-level history per file
- Buttons disabled when no history

### Viewing Changes

```
Click "Show Diff" button
```

- Side-by-side comparison
- Original (left) vs Modified (right)
- Color-coded: Green (added), Red (removed)

### Resetting File

```
Click "Reset" button
```

- Reverts to original generated code
- Confirmation dialog appears
- Cannot be undone

### Downloading Project

```
Click "Download ZIP" button
```

- Includes all edited files
- Includes all unedited files
- Includes metadata file

---

## 🛠️ Developer Reference

### API Endpoints

#### Save File

```http
POST /api/preview/file
Content-Type: application/json

{
  "sessionId": "abc123",
  "path": "src/app.module.ts",
  "content": "// new content"
}
```

#### Undo

```http
POST /api/preview/undo
Content-Type: application/json

{
  "sessionId": "abc123",
  "path": "src/app.module.ts"
}

Response:
{
  "success": true,
  "content": "// previous content",
  "canUndo": true,
  "canRedo": true
}
```

#### Format Code

```http
POST /api/preview/format
Content-Type: application/json

{
  "code": "const x={a:1,b:2}",
  "language": "typescript"
}

Response:
{
  "formatted": "const x = { a: 1, b: 2 };"
}
```

#### Lint Code

```http
POST /api/preview/lint
Content-Type: application/json

{
  "code": "var x = 1;",
  "filePath": "src/test.ts",
  "fix": false
}

Response:
{
  "diagnostics": [
    {
      "line": 1,
      "column": 1,
      "message": "Unexpected var, use let or const instead",
      "severity": 2,
      "ruleId": "no-var"
    }
  ],
  "fixedCode": "let x = 1;" // if fix: true
}
```

#### Typecheck Project

```http
POST /api/preview/typecheck
Content-Type: application/json

{
  "sessionId": "abc123"
}

Response:
{
  "diagnostics": [
    {
      "file": "src/app.module.ts",
      "message": "Type 'string' is not assignable to type 'number'",
      "line": 10,
      "column": 5,
      "category": "error",
      "code": 2322
    }
  ]
}
```

#### Get Diff

```http
GET /api/preview/diff?sessionId=abc123&path=src/app.module.ts

Response:
{
  "original": "// original content",
  "current": "// modified content",
  "isDirty": true
}
```

### Session Manager

```typescript
import {
  createSession,
  getFile,
  updateFile,
  undo,
  redo,
  resetFile,
  getFileDiff,
  getDirtyFiles,
} from "./lib/sessionManager";

// Create session
const sessionId = createSession(files, "my-project");

// Get file
const file = getFile(sessionId, "src/app.ts");
// Returns: FileSession { content, originalContent, version, dirty, ... }

// Update file
updateFile(sessionId, "src/app.ts", "new content");

// Undo/Redo
const previousContent = undo(sessionId, "src/app.ts");
const nextContent = redo(sessionId, "src/app.ts");

// Reset
resetFile(sessionId, "src/app.ts");

// Get diff
const diff = getFileDiff(sessionId, "src/app.ts");

// Get dirty files
const dirtyFiles = getDirtyFiles(sessionId); // ["src/app.ts", ...]
```

### Worker Creation

```typescript
import { createWorker } from "./lib/workerUtils";

// Create worker (handles dev/prod, TypeScript/JavaScript)
const worker = createWorker("lintWorker", {
  resourceLimits: {
    maxOldGenerationSizeMb: 256,
  },
});

// Set timeout
const timeout = setTimeout(() => {
  worker.terminate();
  // handle timeout
}, 10000);

// Handle messages
worker.on("message", (result: any) => {
  clearTimeout(timeout);
  worker.terminate();
  // process result
});

// Handle errors
worker.on("error", (error: any) => {
  clearTimeout(timeout);
  worker.terminate();
  // handle error
});

// Send data
worker.postMessage({ code: "...", filePath: "..." });
```

### Monaco Editor Integration

```typescript
import { CodeEditor } from '@/components/wizard/CodeEditor';

<CodeEditor
  value={code}
  language="typescript"
  fileName="app.module.ts"
  readonly={false}
  onChange={(newValue) => setCode(newValue)}
  diagnostics={[
    {
      line: 10,
      column: 5,
      message: "Error message",
      severity: "error",
      source: "eslint",
    },
  ]}
  onSave={() => saveFile()}
  showSaveIndicator={true}
  isDirty={true}
/>
```

### Diff Editor Integration

```typescript
import { DiffEditor } from '@/components/wizard/DiffEditor';

<DiffEditor
  original={originalCode}
  modified={modifiedCode}
  fileName="app.module.ts"
  language="typescript"
  onClose={() => setShowDiff(false)}
/>
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Maximum code length for formatting/linting (default: 200KB)
MAX_CODE_LENGTH=200000

# Maximum total size for typecheck (default: 5MB)
MAX_TYPECHECK_SIZE=5000000

# Port (default: 5000)
PORT=5000

# Environment (development/production)
NODE_ENV=development
```

### Worker Timeouts

```typescript
// In previewRoutes.ts
const LINT_TIMEOUT = 10000; // 10 seconds
const TYPECHECK_TIMEOUT = 30000; // 30 seconds
```

### Worker Memory Limits

```typescript
// Lint worker
maxOldGenerationSizeMb: 256; // 256MB

// Typecheck worker
maxOldGenerationSizeMb: 512; // 512MB
```

### Session Settings

```typescript
// In sessionManager.ts
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_UNDO_STACK_SIZE = 50; // 50 levels
```

---

## 🐛 Troubleshooting

### Editor Not Loading

**Symptom**: Monaco editor shows spinner forever
**Fix**: Check browser console for errors, ensure @monaco-editor/react is installed

### Lint/Typecheck Timeout

**Symptom**: "Timeout" error after 10-30 seconds
**Fix**: Increase timeout in previewRoutes.ts or reduce file count

### Save Not Working

**Symptom**: Changes don't persist
**Fix**: Check session is not expired (30min TTL), check browser console

### Workers Failing

**Symptom**: Lint/Typecheck always fails
**Fix**: Ensure ESLint dependencies installed, check worker paths

### Undo/Redo Not Working

**Symptom**: Buttons disabled or no effect
**Fix**: Check file was saved first (undo stack only populated after save)

---

## 📋 Keyboard Shortcuts

| Action    | Shortcut      | Context                  |
| --------- | ------------- | ------------------------ |
| Save file | `Ctrl+S`      | Edit mode, file selected |
| Undo      | `Ctrl+Z`      | Editor (Monaco internal) |
| Redo      | `Ctrl+Y`      | Editor (Monaco internal) |
| Find      | `Ctrl+F`      | Editor focused           |
| Replace   | `Ctrl+H`      | Editor focused           |
| Format    | `Shift+Alt+F` | Editor focused (Monaco)  |

---

## 📊 File Limits

| Item                           | Limit      | Reason                      |
| ------------------------------ | ---------- | --------------------------- |
| Single file size               | 200KB      | Prevents DoS on format/lint |
| Total project size (typecheck) | 5MB        | Prevents memory exhaustion  |
| Undo stack per file            | 50 entries | Prevents memory leaks       |
| Session TTL                    | 30 minutes | Frees server resources      |
| Worker memory (lint)           | 256MB      | Sandbox isolation           |
| Worker memory (typecheck)      | 512MB      | TS compiler needs more      |

---

## 🎨 UI States

### File Tree

- **Normal**: White text
- **Selected**: Blue highlight
- **Dirty**: Yellow indicator (future)

### Editor Header

- **Modified Badge**: Yellow, shows when isDirty
- **Saved Badge**: Green with checkmark, shows after save
- **Error Badge**: Red, shows error count
- **Warning Badge**: Yellow, shows warning count

### Action Buttons

- **Enabled**: Normal appearance
- **Disabled**: Grayed out (undo/redo when no history)
- **Loading**: Spinner icon (during operation)

---

## 📦 Dependencies

### Runtime

- `@monaco-editor/react` - Monaco editor wrapper
- `prettier` - Code formatting
- `eslint` - Linting
- `@typescript-eslint/parser` - TypeScript support
- `@typescript-eslint/eslint-plugin` - TS rules
- `typescript` - Compiler API

### Development

- `cross-env` - Cross-platform env vars
- `tsx` - TypeScript execution
- `esbuild` - Worker compilation

---

## 🚀 Performance Tips

1. **Debounce Validation**: Don't run on every keystroke
2. **Lazy Load**: Only validate visible files
3. **Cache Results**: Store validation per version
4. **Incremental Check**: Only check changed files (future)
5. **Background Tasks**: Run validation on idle

---

## 🔐 Security Checklist

- [x] Workers sandboxed (no disk/network)
- [x] Memory limits enforced
- [x] Timeouts prevent hanging
- [x] Payload size limits
- [x] Session expiry
- [x] Path validation (no traversal)
- [ ] Authentication (add for production)
- [ ] Rate limiting (add for production)

---

**Last Updated**: 2025-11-15
**Version**: Sprint 7.0
**Status**: Production Ready ✅
