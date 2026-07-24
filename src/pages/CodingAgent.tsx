import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Code, FolderTree, Terminal, GitBranch, Play, Square, Send,
  ChevronRight, ChevronDown, File, Folder, RefreshCw, Trash2,
  Plus, Search, Clock, CheckCircle2, XCircle, Loader2, Copy,
  Eye, GitCommit, ArrowRight, Sparkles, X, MessageSquare,
  FileCode, FileText, FileJson, FileType2, FileImage, Settings, Database,
  PanelLeftClose, PanelLeftOpen, PanelBottomClose, PanelBottomOpen, PanelRightClose, PanelRightOpen,
  LayoutTemplate
} from 'lucide-react';
import {
  createSession, destroySession, executeTool, listDirectory, readFile,
  getProjectStructure, gitStatus, CodingSession, ToolResult, DirectoryEntry,
  sendChatMessage, ChatMessage, ExecutionPlan
} from '../services/codingAgentApi';

// ── Types ────────────────────────────────────────────────────────────

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  expanded?: boolean;
}

interface ToolCall {
  id: string;
  tool: string;
  args: Record<string, any>;
  status: 'running' | 'success' | 'error';
  output?: any;
  error?: string;
  duration_ms?: number;
  timestamp: number;
  requires_approval?: boolean;
  llm_tool_call_id?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx': return <FileCode className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400 shrink-0" />;
    case 'py': return <FileCode className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />;
    case 'json': return <FileJson className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />;
    case 'md': return <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 shrink-0" />;
    case 'css': case 'scss': return <FileType2 className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400 shrink-0" />;
    case 'html': return <FileCode className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />;
    case 'svg': case 'png': case 'jpg': return <FileImage className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />;
    case 'env': case 'gitignore': return <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    case 'sql': case 'db': case 'sqlite': return <Database className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />;
    default: return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
};

const formatToolName = (name: string) => name.replace('coding_', '').replace(/_/g, ' ');

// ── Main Component ───────────────────────────────────────────────────

const CodingAgent: React.FC = () => {
  // Session state
  const [session, setSession] = useState<CodingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');

  // Layout State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);

  // Panels
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [openFile, setOpenFile] = useState<{ path: string; content: string; lines: number } | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'diff'>('terminal');

  // Chat & LLM
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [pendingLLMMessages, setPendingLLMMessages] = useState<ChatMessage[]>([]);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [gitInfo, setGitInfo] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<ExecutionPlan | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // ── Session Management ────────────────────────────────────────────

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const sess = await createSession(repoUrl || undefined);
      setSession(sess);
      setRepoUrl('');
      // Auto-load project structure
      setTimeout(() => loadProjectStructure(sess.session_id), 500);
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.message;
      if (status === 409) {
        // Stale session — inform user and suggest retry
        addToolCall('session_create', {}, 'error', null, 'A previous session was still active. It has been cleaned up — please try again.');
      } else {
        addToolCall('session_create', {}, 'error', null, detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDestroySession = async () => {
    if (!session || destroying) return;
    setDestroying(true);
    try {
      await destroySession(session.session_id);
    } catch (err: any) {
      // 404 is expected if session was already cleaned up server-side
      if (err?.response?.status !== 404) {
        console.error('Failed to destroy session:', err);
      }
    } finally {
      setSession(null);
      setFileTree([]);
      setOpenFile(null);
      setToolCalls([]);
      setProjectInfo(null);
      setGitInfo(null);
      setActivePlan(null);
      setDestroying(false);
    }
  };

  // ── Tool Execution ────────────────────────────────────────────────

  const addToolCall = (tool: string, args: Record<string, any>, status: 'running' | 'success' | 'error', output?: any, error?: string, duration_ms?: number, requires_approval?: boolean, llm_tool_call_id?: string) => {
    const call: ToolCall = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      tool, args, status, output, error, duration_ms, timestamp: Date.now(), requires_approval, llm_tool_call_id
    };
    setToolCalls(prev => [...prev, call]);
    setTimeout(scrollChat, 100);
    return call.id;
  };

  const updateToolCall = (id: string, update: Partial<ToolCall>) => {
    setToolCalls(prev => prev.map(c => c.id === id ? { ...c, ...update } : c));
    setTimeout(scrollChat, 100);
    if (activeTab === 'terminal') setTimeout(scrollTerminal, 100);
  };

  const runTool = async (toolName: string, args: Record<string, any> = {}): Promise<ToolResult | null> => {
    if (!session) return null;
    const callId = addToolCall(toolName, args, 'running');
    try {
      const result = await executeTool(session.session_id, toolName, args);
      updateToolCall(callId, {
        status: result.success ? 'success' : 'error',
        output: result.output,
        error: result.error || undefined,
        duration_ms: result.duration_ms,
        requires_approval: result.requires_approval
      });
      return result;
    } catch (err: any) {
      updateToolCall(callId, { status: 'error', error: err.message });
      return null;
    }
  };

  const processLLM = async (messages: ChatMessage[]) => {
    if (!session) return;
    setIsAgentThinking(true);
    try {
      const response = await sendChatMessage(session.session_id, messages);
      
      if (response.type === 'message' && response.content) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: response.content! }]);
      } else if (response.type === 'tool_calls' && response.calls) {
        const assistantMsg: ChatMessage = { 
          role: 'assistant', 
          content: '', 
          tool_calls: response.calls.map(c => ({
            id: c.id,
            type: 'function',
            function: { name: c.tool, arguments: JSON.stringify(c.args) }
          }))
        };
        
        setChatHistory(prev => [...prev, assistantMsg]);
        let nextMessages = [...messages, assistantMsg];
        let haltedForApproval = false;

        for (const call of response.calls) {
           const uiCallId = addToolCall(call.tool, call.args, 'running', undefined, undefined, undefined, undefined, call.id);
            try {
             const result = await executeTool(session.session_id, call.tool, call.args);
             if (result.requires_approval) {
               updateToolCall(uiCallId, { status: 'error', error: 'Waiting for approval', requires_approval: true });
               haltedForApproval = true;
               setPendingLLMMessages(nextMessages);
               break; 
             } else {
               updateToolCall(uiCallId, { status: result.success ? 'success' : 'error', output: result.output, error: result.error || undefined, duration_ms: result.duration_ms });
               if (result.success && result.output && result.output.plan) {
                 setActivePlan(result.output.plan);
               }
               nextMessages.push({
                 role: 'tool',
                 content: JSON.stringify(result.success ? result.output : { error: result.error }),
                 tool_call_id: call.id
               });
             }
           } catch (err: any) {
             updateToolCall(uiCallId, { status: 'error', error: err.message });
             nextMessages.push({
               role: 'tool',
               content: JSON.stringify({ error: err.message }),
               tool_call_id: call.id
             });
           }
        }

        if (!haltedForApproval) {
          setChatHistory(nextMessages);
          await processLLM(nextMessages);
        }
      }
    } catch (err: any) {
      addToolCall('llm_error', {}, 'error', null, err.message);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const handleApproveTool = async (callId: string, toolName: string, args: Record<string, any>, llmToolCallId?: string) => {
    if (!session) return;
    updateToolCall(callId, { status: 'running', error: undefined, requires_approval: false });
    try {
      const result = await executeTool(session.session_id, toolName, args, true);
      updateToolCall(callId, {
        status: result.success ? 'success' : 'error',
        output: result.output,
        error: result.error || undefined,
        duration_ms: result.duration_ms,
        requires_approval: result.requires_approval
      });

      if (result.success && result.output && result.output.plan) {
        setActivePlan(result.output.plan);
      }

      if (llmToolCallId && pendingLLMMessages.length > 0) {
        const toolMsg: ChatMessage = {
          role: 'tool',
          content: JSON.stringify(result.success ? result.output : { error: result.error }),
          tool_call_id: llmToolCallId
        };
        const nextMsgs = [...pendingLLMMessages, toolMsg];
        setPendingLLMMessages([]);
        setChatHistory(nextMsgs);
        await processLLM(nextMsgs);
      }
    } catch (err: any) {
      updateToolCall(callId, { status: 'error', error: err.message });
      if (llmToolCallId && pendingLLMMessages.length > 0) {
        const toolMsg: ChatMessage = {
          role: 'tool',
          content: JSON.stringify({ error: err.message }),
          tool_call_id: llmToolCallId
        };
        const nextMsgs = [...pendingLLMMessages, toolMsg];
        setPendingLLMMessages([]);
        setChatHistory(nextMsgs);
        await processLLM(nextMsgs);
      }
    }
  };

  const handleDenyTool = async (callId: string, llmToolCallId?: string) => {
    updateToolCall(callId, { status: 'error', error: 'Execution denied by user.', requires_approval: false });
    if (llmToolCallId && pendingLLMMessages.length > 0) {
      const toolMsg: ChatMessage = {
        role: 'tool',
        content: JSON.stringify({ error: 'Execution denied by user.' }),
        tool_call_id: llmToolCallId
      };
      const nextMsgs = [...pendingLLMMessages, toolMsg];
      setPendingLLMMessages([]);
      setChatHistory(nextMsgs);
      await processLLM(nextMsgs);
    }
  };

  const scrollTerminal = () => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  };

  const scrollChat = () => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  };

  // ── File Tree ─────────────────────────────────────────────────────

  const loadProjectStructure = async (sessionId: string) => {
    try {
      const result = await getProjectStructure(sessionId);
      if (result.success && result.output) {
        setProjectInfo(result.output);
      }
      const treeResult = await listDirectory(sessionId, '.', true);
      if (treeResult.success && treeResult.output?.entries) {
        const tree = buildTree(treeResult.output.entries);
        setFileTree(tree);
      }
      const statusResult = await gitStatus(sessionId);
      if (statusResult.success) {
        setGitInfo(statusResult.output);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const buildTree = (entries: DirectoryEntry[]): FileTreeNode[] => {
    const root: FileTreeNode[] = [];
    const map = new Map<string, FileTreeNode>();

    entries.forEach(e => {
      const node: FileTreeNode = { name: e.name, path: e.path, type: e.type, children: e.type === 'directory' ? [] : undefined };
      map.set(e.path, node);
      const parts = e.path.split('/');
      if (parts.length === 1) {
        root.push(node);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        const parent = map.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        } else {
          root.push(node);
        }
      }
    });

    const sortNodes = (nodes: FileTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(n => n.children && sortNodes(n.children));
    };
    sortNodes(root);
    return root;
  };

  const handleFileClick = async (node: FileTreeNode) => {
    if (node.type === 'directory') {
      node.expanded = !node.expanded;
      setFileTree([...fileTree]);
      return;
    }
    const result = await runTool('coding_file_read', { path: node.path });
    if (result?.success && result.output) {
      setOpenFile({ path: node.path, content: result.output.content, lines: result.output.total_lines });
    }
  };

  // ── Chat / Command Execution ──────────────────────────────────────

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = chatInput.trim();
    if (!cmd || !session) return;
    setChatInput('');

    if (cmd.startsWith('/')) {
      const [command, ...argParts] = cmd.slice(1).split(' ');
      const arg = argParts.join(' ');
      switch (command) {
        case 'run': await runTool('coding_run_command', { command: arg }); break;
        case 'test': await runTool('coding_run_tests', { test_path: arg || undefined }); break;
        case 'search': await runTool('coding_grep_search', { pattern: arg }); break;
        case 'git': await runTool(`coding_git_${arg.split(' ')[0] || 'status'}`, {}); break;
        case 'tree': await runTool('coding_directory_list', { path: arg || '.', recursive: true }); break;
        case 'install': await runTool('coding_install_dependencies', { package_manager: arg || 'npm' }); break;
        default:
          addToolCall('unknown_command', { command }, 'error', null, `Unknown command: /${command}`);
      }
      return;
    }

    const newMsg: ChatMessage = { role: 'user', content: cmd };
    const nextHistory = [...chatHistory, newMsg];
    setChatHistory(nextHistory);
    await processLLM(nextHistory);
  };

  // ── Render Helpers ────────────────────────────────────────────────

  const renderFileTree = (nodes: FileTreeNode[], depth = 0) => (
    <div className="space-y-px relative">
      {depth > 0 && (
        <div className="absolute left-[14px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800/60 z-0 pointer-events-none" />
      )}
      {nodes.map(node => (
        <div key={node.path} className="relative z-10">
          <button
            onClick={() => handleFileClick(node)}
            className={`w-full flex items-center gap-1.5 px-2 py-1 text-[13px] rounded-md transition-colors group relative
              ${openFile?.path === node.path 
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'}
            `}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            {node.type === 'directory' ? (
              <>
                {node.expanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                <Folder className={`w-4 h-4 shrink-0 ${node.expanded ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
              </>
            ) : (
              <>
                <span className="w-3.5 shrink-0" />
                {getFileIcon(node.name)}
              </>
            )}
            <span className="truncate tracking-wide">{node.name}</span>
          </button>
          {node.type === 'directory' && node.expanded && node.children && renderFileTree(node.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-spin" />;
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'error': return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      default: return null;
    }
  };

  // ── No Session View ───────────────────────────────────────────────

  if (!session) {
    return (
      <>
        <Helmet><title>Coding Agent Workspace</title></Helmet>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-xl w-full text-center space-y-10 relative z-10 animate-in fade-in zoom-in-95 duration-700 coding-agent-hero-tut">
            {/* Hero */}
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 dark:opacity-40 animate-pulse" />
                <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-secondary-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary-500/20 rotate-3">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-slate-400 dark:bg-clip-text tracking-tight mb-4">
                  Coding Agent Workspace
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your autonomous AI software engineer. Provision a secure sandbox to build, edit, and test code in real-time.
                </p>
              </div>
            </div>

            {/* Quick Start Card */}
            <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl space-y-6">
              <div className="space-y-2 text-left coding-agent-repo-tut">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Repository (Optional)</label>
                <div className="relative">
                  <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo.git"
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm shadow-sm dark:shadow-none"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="coding-agent-start-tut w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-md dark:shadow-xl dark:shadow-white/10"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {loading ? 'Provisioning Sandbox...' : 'Initialize Workspace'}
              </button>
            </div>

            {/* Features list */}
            <div className="flex items-center justify-center gap-8 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-2"><FolderTree className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Full Filesystem</span>
              <span className="flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Docker Sandbox</span>
              <span className="flex items-center gap-2"><GitCommit className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Git Integration</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Active Session View (IDE Layout) ──────────────────────────────

  return (
    <>
      <Helmet><title>Workspace | Coding Agent</title></Helmet>
      <div className="coding-agent-workspace-tut h-[calc(100vh-64px)] flex flex-col bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-sans overflow-hidden transition-colors">

        {/* Global Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className={`p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${leftSidebarOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} title="Toggle Explorer">
              {leftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            <div className="flex items-center gap-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-md text-xs">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse dark:shadow-[0_0_8px_rgba(255,70,150,0.55)]" />
              <span className="text-indigo-700 dark:text-indigo-400 font-semibold tracking-wide">SANDBOX ACTIVE</span>
            </div>
            {gitInfo?.branch && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs">
                <GitBranch className="w-3 h-3 text-slate-500" />
                <span className="font-mono text-slate-600 dark:text-slate-400">{gitInfo.branch}</span>
                {gitInfo.files?.length > 0 && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400 font-bold">*{gitInfo.files.length}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setBottomPanelOpen(!bottomPanelOpen)} className={`p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${bottomPanelOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} title="Toggle Terminal">
              {bottomPanelOpen ? <PanelBottomClose className="w-4 h-4" /> : <PanelBottomOpen className="w-4 h-4" />}
            </button>
            <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={`p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${rightSidebarOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} title="Toggle Chat">
              {rightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button
              onClick={handleDestroySession}
              disabled={destroying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {destroying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3 fill-current" />}
              {destroying ? 'Ending...' : 'End'}
            </button>
          </div>
        </div>

        {/* IDE Layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left Sidebar: Explorer */}
          <div className={`flex flex-col bg-slate-50/80 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${leftSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0'}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-900/80">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Explorer</span>
              <button onClick={() => session && loadProjectStructure(session.session_id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {fileTree.length > 0 ? renderFileTree(fileTree) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-2 opacity-50">
                  <FolderTree className="w-8 h-8" />
                  <span className="text-xs">No files loaded</span>
                </div>
              )}
            </div>
          </div>

          {/* Central Area: Editor + Bottom Terminal */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
            
            {/* Editor Top Bar (Breadcrumbs) */}
            {openFile ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800/50 text-[13px]">
                {getFileIcon(openFile.path)}
                <div className="flex items-center text-slate-500 dark:text-slate-400 font-mono">
                  {openFile.path.split('/').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      <span className={i === arr.length - 1 ? 'text-slate-900 dark:text-slate-200 font-medium' : ''}>{part}</span>
                      {i < arr.length - 1 && <ChevronRight className="w-3 h-3 mx-1 opacity-40 dark:opacity-50" />}
                    </React.Fragment>
                  ))}
                </div>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">{openFile.lines} lines</span>
              </div>
            ) : (
              <div className="h-10 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800/50 flex items-center px-4">
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">No file open</span>
              </div>
            )}

            {/* Code Viewer */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 custom-scrollbar relative">
              {openFile ? (
                <div className="flex font-mono text-[13px] leading-relaxed">
                  {/* Line Numbers */}
                  <div className="flex flex-col items-end py-4 px-3 bg-slate-50 dark:bg-slate-900/30 border-r border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 select-none min-h-full">
                    {Array.from({ length: openFile.lines }, (_, i) => (
                      <span key={i + 1} className="w-8 text-right pr-2">{i + 1}</span>
                    ))}
                  </div>
                  {/* Code Content */}
                  <pre className="flex-1 p-4 text-slate-800 dark:text-slate-300 whitespace-pre overflow-x-auto custom-scrollbar">
                    {openFile.content}
                  </pre>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 dark:opacity-20">
                  <LayoutTemplate className="w-32 h-32 text-slate-900 dark:text-slate-300" />
                </div>
              )}
            </div>

            {/* Bottom Panel: Terminal */}
            <div className={`flex flex-col bg-slate-50 dark:bg-black transition-all duration-300 ease-in-out border-t border-slate-200 dark:border-slate-800 ${bottomPanelOpen ? 'h-64 opacity-100' : 'h-0 opacity-0 border-t-0'}`}>
              <div className="flex items-center px-4 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveTab('terminal')} className={`text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === 'terminal' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Terminal Output</button>
                  <button onClick={() => setActiveTab('diff')} className={`text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === 'diff' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Git Diff</button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setToolCalls([])} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500" title="Clear">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => setBottomPanelOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {activeTab === 'terminal' && (
                  <div ref={terminalRef} className="h-full overflow-y-auto p-4 space-y-3 font-mono text-[12px] custom-scrollbar bg-white dark:bg-secondary-950">
                    {toolCalls.length === 0 ? (
                      <div className="text-slate-400 dark:text-slate-600 text-center py-10 opacity-70 dark:opacity-50 select-none">
                        Terminal ready. Execute commands via chat.
                      </div>
                    ) : (
                      toolCalls.map(call => (
                        <div key={call.id} className="font-mono">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-emerald-500 dark:text-emerald-400">❯</span>
                            <span className="text-indigo-600 dark:text-indigo-300 font-bold">{formatToolName(call.tool)}</span>
                            <span className="text-slate-500">{JSON.stringify(call.args)}</span>
                            {getStatusIcon(call.status)}
                            {call.duration_ms && <span className="text-slate-400 dark:text-slate-600 text-[10px] ml-auto">{call.duration_ms}ms</span>}
                          </div>
                          {call.error && <div className="text-rose-600 dark:text-rose-400 ml-4 mb-2">{call.error}</div>}
                          {call.output && (
                            <div className="text-slate-700 dark:text-slate-400 ml-4 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                              {typeof call.output === 'string' ? call.output :
                                call.output.content || call.output.stdout || call.output.diff || call.output.tree ||
                                JSON.stringify(call.output, null, 2)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === 'diff' && (
                  <div className="h-full overflow-y-auto p-4 bg-white dark:bg-secondary-950 custom-scrollbar">
                    <button
                      onClick={() => runTool('coding_git_diff', {})}
                      className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <GitCommit className="w-3.5 h-3.5" /> Request Git Diff
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Integrated Chat */}
          <div className={`flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${rightSidebarOpen ? 'w-[350px] opacity-100' : 'w-0 opacity-0 border-l-0'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Agent Chat</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4" ref={chatRef}>
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-900 dark:text-indigo-200">
                <h4 className="font-bold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/> System Online</h4>
                <p className="text-indigo-700/80 dark:text-indigo-300/80 text-xs">Workspace provisioned. I can read files, write code, run commands, and manage version control. How can I help?</p>
              </div>

              {/* Active Plan Panel */}
              {activePlan && (
                <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <LayoutTemplate className="w-4 h-4" /> Active Plan
                    </h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      {activePlan.progress || '0%'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{activePlan.goal}</p>
                  
                  <div className="space-y-2">
                    {activePlan.tasks.map((task: any) => (
                      <div key={task.id} className={`flex items-start gap-2 p-2 rounded-lg border ${task.status === 'in_progress' ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-transparent border-transparent'} transition-colors`}>
                        <div className="mt-0.5 shrink-0">
                          {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {task.status === 'in_progress' && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
                          {task.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                          {(task.status === 'planned' || task.status === 'ready' || task.status === 'blocked') && <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                          {task.status === 'skipped' && <span className="text-[10px] text-slate-400">⏭</span>}
                        </div>
                        <div>
                          <div className={`text-[13px] font-medium ${task.status === 'completed' ? 'text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-700 dark:text-slate-200'}`}>
                            {task.title}
                          </div>
                          {task.status === 'in_progress' && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{task.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unified Chat Feed */}
              {chatHistory.map((msg, idx) => {
                if (msg.role === 'user') {
                  return (
                    <div key={`chat-${idx}`} className="flex justify-end animate-in fade-in slide-in-from-right-2">
                      <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] text-[13px] shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                if (msg.role === 'assistant') {
                  return (
                    <div key={`chat-${idx}`} className="space-y-3">
                      {msg.content && (
                        <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
                          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%] text-[13px] shadow-sm border border-slate-100 dark:border-slate-700 whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </div>
                      )}
                      {msg.tool_calls && msg.tool_calls.map((tc: any) => {
                        const call = toolCalls.find(c => c.llm_tool_call_id === tc.id);
                        if (!call) return null; // Wait for it to be added
                        return (
                          <div key={`tc-${call.id}`} className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                              {call.requires_approval ? (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center shadow-md dark:shadow-lg">
                                      <span className="text-white text-xs font-bold">!</span>
                                    </div>
                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">Action Requires Approval</span>
                                  </div>
                                  <div className="text-[13px] text-slate-800 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg font-mono border border-amber-200 dark:border-amber-900/50 shadow-inner dark:shadow-none mb-3">
                                    <span className="text-amber-700 dark:text-amber-400 font-semibold">{formatToolName(call.tool)}</span>
                                    <span className="text-slate-500 dark:text-slate-400 ml-2">{JSON.stringify(call.args)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <button 
                                      onClick={() => handleApproveTool(call.id, call.tool, call.args, tc.id)}
                                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleDenyTool(call.id, tc.id)}
                                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-600"
                                    >
                                      Deny
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center shadow-md dark:shadow-lg">
                                      <Code className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Action</span>
                                    {getStatusIcon(call.status)}
                                  </div>
                                  <div className="text-[13px] text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg font-mono border border-slate-200 dark:border-slate-800/50 shadow-inner dark:shadow-none">
                                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{formatToolName(call.tool)}</span>
                                    <span className="text-slate-500 ml-2">{JSON.stringify(call.args)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return null; // role: 'tool' is hidden since it's displayed in the ToolCall UI
              })}
              
              {isAgentThinking && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-2xl rounded-bl-sm text-[13px] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    Agent is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <form onSubmit={handleChatSubmit} className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask agent or type /run..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-[13px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition-colors shadow-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.5); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.8); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 0.8); }
      `}</style>
    </>
  );
};

export default CodingAgent;
