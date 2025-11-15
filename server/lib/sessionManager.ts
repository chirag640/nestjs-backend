import { nanoid } from "nanoid";

export interface FileSession {
  content: string;
  originalContent: string; // Store original generated content for reset/diff
  version: number;
  dirty: boolean;
  lastModified: number;
  undoStack: string[];
  redoStack: string[];
}

export interface Session {
  id: string;
  files: Map<string, FileSession>;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  projectName: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

// In-memory session storage with advanced file versioning
const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_UNDO_STACK_SIZE = 50; // Limit memory usage per file

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start the cleanup interval for expired sessions
 * Idempotent - safe to call multiple times
 */
export function startCleanup(): void {
  if (cleanupTimer) {
    return; // Already running
  }

  cleanupTimer = setInterval(() => {
    const now = new Date();
    sessions.forEach((session, sessionId) => {
      if (session.expiresAt < now) {
        sessions.delete(sessionId);
        console.log(
          `[SessionManager] Cleaned up expired session: ${sessionId}`
        );
      }
    });
  }, CLEANUP_INTERVAL_MS);

  console.log("[SessionManager] Cleanup interval started");
}

/**
 * Stop the cleanup interval
 * Safe to call multiple times
 */
export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log("[SessionManager] Cleanup interval stopped");
  }
}

/**
 * Create a new session with generated files
 */
export function createSession(
  files: GeneratedFile[],
  projectName: string
): string {
  const sessionId = nanoid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const fileMap = new Map<string, FileSession>();
  files.forEach((file) => {
    fileMap.set(file.path, {
      content: file.content,
      originalContent: file.content, // Store original for reset/diff
      version: 1,
      dirty: false,
      lastModified: now.getTime(),
      undoStack: [],
      redoStack: [],
    });
  });

  sessions.set(sessionId, {
    id: sessionId,
    files: fileMap,
    createdAt: now,
    expiresAt,
    lastActivityAt: now,
    projectName,
  });

  console.log(
    `[SessionManager] Created session ${sessionId} with ${files.length} files, expires at ${expiresAt.toISOString()}`
  );
  return sessionId;
}

/**
 * Get session by ID (returns undefined if not found or expired)
 */
export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const now = new Date();

  // Check if expired
  if (session.expiresAt < now) {
    sessions.delete(sessionId);
    return undefined;
  }

  // Update last activity and extend TTL
  session.lastActivityAt = now;
  session.expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  return session;
}

/**
 * Get file content from session
 */
export function getFile(
  sessionId: string,
  path: string
): FileSession | undefined {
  const session = getSession(sessionId);
  if (!session) return undefined;

  return session.files.get(path);
}

/**
 * Update file content with undo/redo support
 */
export function updateFile(
  sessionId: string,
  path: string,
  newContent: string
): boolean {
  const session = getSession(sessionId);
  if (!session) return false;

  const fileSession = session.files.get(path);
  if (!fileSession) return false;

  // Push current content to undo stack
  fileSession.undoStack.push(fileSession.content);

  // Limit undo stack size
  if (fileSession.undoStack.length > MAX_UNDO_STACK_SIZE) {
    fileSession.undoStack.shift();
  }

  // Clear redo stack on new edit
  fileSession.redoStack = [];

  // Update content
  fileSession.content = newContent;
  fileSession.version += 1;
  fileSession.dirty = newContent !== fileSession.originalContent;
  fileSession.lastModified = Date.now();

  return true;
}

/**
 * Undo last change
 */
export function undo(sessionId: string, path: string): string | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const fileSession = session.files.get(path);
  if (!fileSession || fileSession.undoStack.length === 0) return null;

  // Pop from undo stack
  const previousContent = fileSession.undoStack.pop()!;

  // Push current to redo stack
  fileSession.redoStack.push(fileSession.content);

  // Update content
  fileSession.content = previousContent;
  fileSession.version += 1;
  fileSession.dirty = previousContent !== fileSession.originalContent;
  fileSession.lastModified = Date.now();

  return previousContent;
}

/**
 * Redo last undo
 */
export function redo(sessionId: string, path: string): string | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const fileSession = session.files.get(path);
  if (!fileSession || fileSession.redoStack.length === 0) return null;

  // Pop from redo stack
  const nextContent = fileSession.redoStack.pop()!;

  // Push current to undo stack
  fileSession.undoStack.push(fileSession.content);

  // Update content
  fileSession.content = nextContent;
  fileSession.version += 1;
  fileSession.dirty = nextContent !== fileSession.originalContent;
  fileSession.lastModified = Date.now();

  return nextContent;
}

/**
 * Reset file to original generated content
 */
export function resetFile(sessionId: string, path: string): boolean {
  const session = getSession(sessionId);
  if (!session) return false;

  const fileSession = session.files.get(path);
  if (!fileSession) return false;

  // Push current to undo stack before reset
  fileSession.undoStack.push(fileSession.content);

  // Reset to original
  fileSession.content = fileSession.originalContent;
  fileSession.version += 1;
  fileSession.dirty = false;
  fileSession.redoStack = [];
  fileSession.lastModified = Date.now();

  return true;
}

/**
 * Get diff between original and current content
 */
export function getFileDiff(
  sessionId: string,
  path: string
): { original: string; current: string; isDirty: boolean } | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const fileSession = session.files.get(path);
  if (!fileSession) return null;

  return {
    original: fileSession.originalContent,
    current: fileSession.content,
    isDirty: fileSession.dirty,
  };
}

/**
 * Get all dirty files in session
 */
export function getDirtyFiles(sessionId: string): string[] {
  const session = getSession(sessionId);
  if (!session) return [];

  const dirtyFiles: string[] = [];
  session.files.forEach((fileSession, path) => {
    if (fileSession.dirty) {
      dirtyFiles.push(path);
    }
  });

  return dirtyFiles;
}

/**
 * Delete session
 */
export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  totalSessions: number;
  totalFiles: number;
  totalDirtyFiles: number;
} {
  let totalFiles = 0;
  let totalDirtyFiles = 0;

  sessions.forEach((session) => {
    totalFiles += session.files.size;
    session.files.forEach((fileSession) => {
      if (fileSession.dirty) totalDirtyFiles++;
    });
  });

  return {
    totalSessions: sessions.size,
    totalFiles,
    totalDirtyFiles,
  };
}
