/**
 * Coding Agent API Service
 * 
 * Thin wrapper around the /coding-agent REST endpoints.
 * Keeps the main api.ts clean while providing typed access
 * to session management and tool execution.
 */
import api from './api';

// ── Types ─────────────────────────────────────────────────────────

export interface CodingSession {
  session_id: string;
  status: string;
  workspace_path?: string;
  repo_url?: string;
  has_container?: boolean;
  created_at?: number;
  last_activity_at?: number;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  output: any;
  error: string | null;
  duration_ms: number;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number | null;
}

// ── API Functions ─────────────────────────────────────────────────

export async function createSession(repoUrl?: string, githubToken?: string): Promise<CodingSession> {
  const resp = await api.request({
    method: 'POST',
    url: '/coding-agent/sessions',
    data: { repo_url: repoUrl || null, github_token: githubToken || null },
  });
  return resp.data;
}

export async function getSession(sessionId: string): Promise<CodingSession> {
  const resp = await api.request({
    method: 'GET',
    url: `/coding-agent/sessions/${sessionId}`,
  });
  return resp.data;
}

export async function destroySession(sessionId: string): Promise<void> {
  await api.request({
    method: 'DELETE',
    url: `/coding-agent/sessions/${sessionId}`,
  });
}

export async function executeTool(
  sessionId: string,
  toolName: string,
  args: Record<string, any> = {}
): Promise<ToolResult> {
  const resp = await api.request({
    method: 'POST',
    url: `/coding-agent/sessions/${sessionId}/tools`,
    data: { tool_name: toolName, arguments: args },
  });
  return resp.data;
}

// ── Convenience Wrappers ──────────────────────────────────────────

export async function listDirectory(sessionId: string, path = '.', recursive = false): Promise<ToolResult> {
  return executeTool(sessionId, 'coding_directory_list', { path, recursive, max_depth: 3 });
}

export async function readFile(sessionId: string, path: string, startLine?: number, endLine?: number): Promise<ToolResult> {
  return executeTool(sessionId, 'coding_file_read', { path, start_line: startLine, end_line: endLine });
}

export async function getProjectStructure(sessionId: string): Promise<ToolResult> {
  return executeTool(sessionId, 'coding_get_project_structure', {});
}

export async function grepSearch(sessionId: string, pattern: string, searchPath = '.'): Promise<ToolResult> {
  return executeTool(sessionId, 'coding_grep_search', { pattern, search_path: searchPath });
}

export async function gitStatus(sessionId: string): Promise<ToolResult> {
  return executeTool(sessionId, 'coding_git_status', {});
}

export async function gitDiff(sessionId: string): Promise<ToolResult> {
  return executeTool(sessionId, 'coding_git_diff', {});
}

export default {
  createSession, getSession, destroySession, executeTool,
  listDirectory, readFile, getProjectStructure, grepSearch, gitStatus, gitDiff,
};
