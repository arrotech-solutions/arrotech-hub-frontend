import { Activity, BarChart3, Bot, Calendar, CheckCircle, ChevronLeft, ChevronRight, Copy, CreditCard, Database, Download, Edit, FileText, Globe, Image, Mail, MapPin, MessageCircle, MessageSquare, Mic, Moon, MoreVertical, Music, Palette, Paperclip, Phone, Plus, Save, Send, Settings, Share2, Shield, ShoppingCart, Smile, Sparkles, Sun, Trash2, Upload, User, Users, Video, XCircle, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { ChatToolsResponse, Conversation, ExtractedToolCall, LLMProviderResponse, Message } from '../types';
import WorkflowBuilderModal from '../components/WorkflowBuilderModal';
import AgentCreatorModal from '../components/AgentCreatorModal';

// TypeScript declarations for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface ChatProps { }

const Chat: React.FC<ChatProps> = () => {
  useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<LLMProviderResponse | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [, setTools] = useState<ChatToolsResponse | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showDetailedResults] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingConversation, setEditingConversation] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [messageVersions, setMessageVersions] = useState<{ [key: number]: Message[] }>({});
  const [currentVersion, setCurrentVersion] = useState<{ [key: number]: number }>({});
  
  // Workflow Builder State
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [showAgentCreator, setShowAgentCreator] = useState(false);
  const [extractedToolCalls, setExtractedToolCalls] = useState<ExtractedToolCall[]>([]);
  const [createdWorkflowId, setCreatedWorkflowId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);


  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('chat-theme', isDarkMode ? 'dark' : 'light');
    // Update document class for global theme
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    loadConversations();
    loadProviders();
    loadTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsRecording(true);
        toast.success('Voice recording started...');
      };
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
          // Note: interim results are not displayed in this implementation
        }
        
        if (finalTranscript) {
          setInputMessage(prev => prev + finalTranscript);
          toast.success('Voice input added!');
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access.');
        } else {
          toast.error('Voice recognition error. Please try again.');
        }
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Collect all tool calls from the current conversation for workflow extraction
  const collectToolCallsForWorkflow = (): ExtractedToolCall[] => {
    const toolCalls: ExtractedToolCall[] = [];
    let callIndex = 0;

    messages.forEach((msg) => {
      if (msg.tools_called && msg.tools_called.length > 0) {
        msg.tools_called.forEach((tool) => {
          toolCalls.push({
            id: tool.id || `call_${callIndex}`,
            message_id: msg.id,
            tool_name: tool.name,
            arguments: tool.arguments || {},
            result: tool.result || {},
            success: tool.result?.success !== false,
            timestamp: msg.created_at || null,
          });
          callIndex++;
        });
      }
    });

    return toolCalls;
  };

  // Check if current conversation has tool calls that can be saved as workflow
  const hasToolCallsForWorkflow = (): boolean => {
    return messages.some(msg => msg.tools_called && msg.tools_called.length > 0);
  };

  // Get count of successful tool calls
  const getSuccessfulToolCallCount = (): number => {
    let count = 0;
    messages.forEach((msg) => {
      if (msg.tools_called) {
        count += msg.tools_called.filter(tool => tool.result?.success !== false).length;
      }
    });
    return count;
  };

  // Handle opening workflow builder
  const handleOpenWorkflowBuilder = () => {
    const toolCalls = collectToolCallsForWorkflow();
    if (toolCalls.length === 0) {
      toast.error('No tool executions found in this conversation to save as workflow');
      return;
    }
    setExtractedToolCalls(toolCalls);
    setShowWorkflowBuilder(true);
  };

  // Handle workflow created callback
  const handleWorkflowCreated = (workflow: any) => {
    setCreatedWorkflowId(workflow.id);
    toast.success(`Workflow "${workflow.name}" created successfully!`);
  };

  // Handle create agent from workflow
  const handleCreateAgentFromWorkflow = (workflowId: number) => {
    setCreatedWorkflowId(workflowId);
    setShowWorkflowBuilder(false);
    setShowAgentCreator(true);
  };

  // Handle agent created callback
  const handleAgentCreated = (agent: any) => {
    toast.success(`Agent created successfully! ID: ${agent.agent_id}`);
    setShowAgentCreator(false);
    setCreatedWorkflowId(null);
  };

  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      const response = await apiService.getConversations();
      if (response.success) {
        console.log('Conversations loaded:', response.data);
        setConversations(response.data);
        
        // If no conversation is selected, select the first one
        if (response.data.length > 0 && !currentConversation) {
          console.log('No conversation selected, selecting first one:', response.data[0]);
          setCurrentConversation(response.data[0]);
        }
        // If current conversation exists, update it with latest data
        else if (currentConversation && response.data.length > 0) {
          const updatedConversation = response.data.find(
            conv => conv.id === currentConversation.id
          );
          if (updatedConversation) {
            console.log('Updating current conversation with latest data:', updatedConversation);
            setCurrentConversation(updatedConversation);
          } else {
            console.log('Could not find current conversation in updated list');
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await apiService.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await apiService.getLLMProviders();
      if (response.success) {
        setProviders(response.data);
        const defaultProvider = response.data.default || 
          response.data.providers[0] || 
          (response.data.all_providers?.find(p => p.available)?.id);
        setSelectedProvider(defaultProvider || 'ollama');
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setSelectedProvider('ollama');
    }
  };

  const loadTools = async () => {
    try {
      const response = await apiService.getAvailableTools();
      if (response.success) {
        setTools(response.data);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  const getProviderDisplayName = (provider: string) => {
    const displayNames: Record<string, string> = {
      'openai': 'OpenAI GPT',
      'gemini': 'Google Gemini',
      'ollama': 'Ollama (Local)',
      'huggingface': 'Hugging Face',
      'togetherai': 'Together AI',
      'anthropic': 'Anthropic Claude'
    };
    return displayNames[provider] || provider;
  };

  const isProviderAvailable = (provider: string) => {
    return providers?.all_providers?.find(p => p.id === provider)?.available || false;
  };

  const createNewConversation = async () => {
    if (!newConversationTitle.trim()) return;

    try {
      const response = await apiService.createConversation({
        title: newConversationTitle.trim()
      });
      if (response.success) {
        // Reload conversations to get the updated list
        const conversationsResponse = await apiService.getConversations();
        if (conversationsResponse.success) {
          setConversations(conversationsResponse.data);
          
          // Set the newly created conversation as current
          setCurrentConversation(response.data);
          setMessages([]); // Clear messages for new conversation
        }
        
        setShowNewConversationModal(false);
        setNewConversationTitle('');
        toast.success('New conversation created!');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      await apiService.deleteConversation(conversationId);
      toast.success('Conversation deleted successfully');

      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // If deleted conversation was current, clear it
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
      }

      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const startEditingConversation = (conversation: Conversation) => {
    setEditingConversation(conversation.id);
    setEditingTitle(conversation.title || '');
    setShowOptionsMenu(null);
  };

  const cancelEditingConversation = () => {
    setEditingConversation(null);
    setEditingTitle('');
  };

  const updateConversationTitle = async (conversationId: number) => {
    try {
      const response = await apiService.updateConversation(conversationId, editingTitle);
      if (response.success) {
        toast.success('Conversation title updated successfully');

        // Update conversations list
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, title: editingTitle }
            : conv
        ));

        // Update current conversation if it's the one being edited
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(prev => prev ? { ...prev, title: editingTitle } : null);
        }

        setEditingConversation(null);
        setEditingTitle('');
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast.error('Failed to update conversation title');
    }
  };

  const handleOptionsMenuClick = (conversationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowOptionsMenu(showOptionsMenu === conversationId ? null : conversationId);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.options-menu')) {
      setShowOptionsMenu(null);
    }
  };

  const startEditingMessage = (message: Message) => {
    setEditingMessage(message.id);
    setEditingMessageText(message.content);
  };

  const cancelEditingMessage = () => {
    setEditingMessage(null);
    setEditingMessageText('');
  };

  const saveEditedMessage = async () => {
    if (!editingMessage || !editingMessageText.trim()) return;

    try {
      // Update the message in the local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === editingMessage 
            ? { ...msg, content: editingMessageText.trim() }
            : msg
        )
      );

      // Clear editing state
      setEditingMessage(null);
      setEditingMessageText('');

      // Optionally, you could also update the message on the server here
      // await apiService.updateMessage(editingMessage, editingMessageText.trim());

    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const resendEditedMessage = async () => {
    if (!editingMessage || !editingMessageText.trim()) return;

    try {
      const editedContent = editingMessageText.trim();
      
      // Update the original message content
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === editingMessage 
            ? { ...msg, content: editedContent }
            : msg
        )
      );

      // Store the current AI response as a version before sending new one
      const currentResponse = messages.find(msg => 
        msg.role === 'assistant' && 
        msg.id > editingMessage && 
        !messages.some(m => m.role === 'user' && m.id > editingMessage && m.id < msg.id)
      );

      if (currentResponse) {
        const messageId = editingMessage;
        setMessageVersions(prev => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), currentResponse]
        }));
        
        // Set current version to the latest
        const versionCount = (messageVersions[messageId] || []).length + 1;
        setCurrentVersion(prev => ({
          ...prev,
          [messageId]: versionCount
        }));
      }

      // Send the edited message directly without copying to input
      await sendMessageFromEdit(editedContent);

      // Clear editing state after sending
      setEditingMessage(null);
      setEditingMessageText('');

    } catch (error) {
      console.error('Error resending message:', error);
      toast.error('Failed to resend message');
    }
  };

  const sendMessageFromEdit = async (content: string) => {
    if (!content.trim() || !currentConversation) return;

    setIsLoading(true);
    try {
      const messageData = {
        content: content,
        provider: selectedProvider || undefined
      };
      
      const response = await apiService.sendMessage(currentConversation.id, messageData);
      
      // Add the new message to the messages list
      setMessages(prev => [...prev, response]);
      scrollToBottom();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const switchVersion = (messageId: number, versionIndex: number) => {
    setCurrentVersion(prev => ({
      ...prev,
      [messageId]: versionIndex
    }));
  };

  const getCurrentResponse = (messageId: number) => {
    const versions = messageVersions[messageId] || [];
    const currentVersionIndex = currentVersion[messageId] || 0;
    return versions[currentVersionIndex] || null;
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (selectedProvider && !isProviderAvailable(selectedProvider)) {
      toast.error(`The selected provider "${getProviderDisplayName(selectedProvider)}" is not configured. Please configure it or select an available provider.`);
      return;
    }

    setIsLoading(true);
    const messageContent = inputMessage.trim();
    setInputMessage('');

    try {
      let conversationToUse = currentConversation;

      // If no conversation exists, create one automatically
      if (!conversationToUse) {
        console.log('No conversation exists, creating new one automatically...');
        
        // Create a conversation with a title based on the first message
        const conversationTitle = messageContent.length > 50 
          ? messageContent.substring(0, 50) + '...' 
          : messageContent;
        
        const createResponse = await apiService.createConversation({
          title: conversationTitle
        });
        
        if (createResponse.success) {
          conversationToUse = createResponse.data;
          setCurrentConversation(conversationToUse);
          setMessages([]); // Clear messages for new conversation
          
          // Update conversations list
          const conversationsResponse = await apiService.getConversations();
          if (conversationsResponse.success) {
            setConversations(conversationsResponse.data);
          }
          
          console.log('New conversation created automatically:', conversationToUse);
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      const messageData = {
        content: messageContent,
        provider: selectedProvider || undefined
      };

      console.log('Sending message to conversation:', conversationToUse.id);
      console.log('Message data:', messageData);
      
      const response = await apiService.sendMessage(conversationToUse.id, messageData);
      
      console.log('Message sent successfully:', response);
      
      // Add the new message to the messages list
      setMessages(prev => [...prev, response]);
      
      // Reload conversations to update the list
      loadConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore the input message if there was an error
      setInputMessage(messageContent);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupConversationsByTime = (conversations: Conversation[]) => {
    // Sort conversations by created_at in descending order (most recent first)
    const sortedConversations = [...conversations].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const groups: { [key: string]: Conversation[] } = {
      'Today': [],
      'Yesterday': [],
      'Last 7 days': [],
      'Last 30 days': [],
      'Older': []
    };

    sortedConversations.forEach(conversation => {
      const conversationDate = new Date(conversation.created_at);
      const conversationDay = new Date(conversationDate.getFullYear(), conversationDate.getMonth(), conversationDate.getDate());

      if (conversationDay.getTime() === today.getTime()) {
        groups['Today'].push(conversation);
      } else if (conversationDay.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(conversation);
      } else if (conversationDate >= last7Days) {
        groups['Last 7 days'].push(conversation);
      } else if (conversationDate >= last30Days) {
        groups['Last 30 days'].push(conversation);
      } else {
        groups['Older'].push(conversation);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, conversations]) => conversations.length > 0)
    );
  };

  const formatMessage = (content: string, toolsCalled?: Array<{ name: string; arguments: Record<string, any>; result?: Record<string, any> }>) => {
    // Enhanced business-friendly message formatting with detailed tool results
    const lines = content.split('\n');
    const formattedLines: JSX.Element[] = [];

    lines.forEach((line, index) => {
      // Skip empty lines, technical tool calls, and code blocks
      if (!line.trim() ||
        line.startsWith('TOOL_CALL:') ||
        line.startsWith('```javascript') ||
        line.startsWith('```') ||
        (line.includes('{') && line.includes('}') && line.includes('tool')) ||
        (line.includes('arguments') && line.includes('{')) ||
        (line.includes('result') && line.includes('{'))) {
        return;
      }
      
      // Format different types of content with enhanced styling
      if (line.includes('🎉') || line.includes('✅') || line.includes('💬') || 
          line.includes('📱') || line.includes('👤') || line.includes('💰') || 
          line.includes('📊')) {
        // Success/status messages with emojis
        formattedLines.push(
          <div key={`line-${index}`} className="mb-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-r-lg shadow-sm">
            <div className="text-green-800 font-medium text-sm leading-relaxed">
              {line}
            </div>
          </div>
        );
      } else if (line.includes('⚠️')) {
        // Warning/error messages
        formattedLines.push(
          <div key={`line-${index}`} className="mb-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-r-lg shadow-sm">
            <div className="text-yellow-800 font-medium text-sm leading-relaxed">
              {line}
            </div>
          </div>
        );
      } else if (line.includes('**') && line.includes('**')) {
        // Bold headers with enhanced styling
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedLines.push(
          <div 
            key={`line-${index}`}
            className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      } else if (line.includes('Channel Created') || line.includes('Message Sent') || 
                 line.includes('Contact Added') || line.includes('Deal Created') || 
                 line.includes('Report Generated') || line.includes('Action Completed')) {
        // Business action confirmations
        formattedLines.push(
          <div key={`line-${index}`} className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg shadow-sm">
            <div className="text-blue-800 text-sm font-medium leading-relaxed">
              {line}
            </div>
          </div>
        );
      } else if (line.includes('Issue') || line.includes('Error') || line.includes('Problem')) {
        // Error messages
        formattedLines.push(
          <div key={`line-${index}`} className="mb-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg shadow-sm">
            <div className="text-red-800 text-sm font-medium leading-relaxed">
              {line}
            </div>
          </div>
        );
      } else {
        // Regular text with improved readability
        formattedLines.push(
          <div key={`line-${index}`} className="mb-2 text-gray-700 leading-relaxed text-sm">
            {line}
          </div>
        );
      }
    });

    // Add detailed tool execution results if available
    if (toolsCalled && toolsCalled.length > 0) {
      toolsCalled.forEach((tool, toolIndex) => {
        // Check if tool has a result
        if (tool.result) {
          if (tool.result.success) {
            // Extract the actual result data
            let resultMessage = '';
            let detailedData = null;

            // Handle different result structures
            if (tool.result.result) {
              resultMessage = tool.result.result;
              detailedData = tool.result.result;
            } else if (tool.result.data) {
              // Check if data has a message property
              if (tool.result.data.message) {
                resultMessage = tool.result.data.message;
              } else if (tool.result.data.result) {
                resultMessage = tool.result.data.result;
              } else {
                // For complex data structures like channels, create a summary
                if (tool.result.data.channels) {
                  const channelCount = tool.result.data.channels.length;
                  resultMessage = `Found ${channelCount} channels`;
                } else if (tool.result.data.contacts) {
                  const contactCount = tool.result.data.contacts.length;
                  resultMessage = `Found ${contactCount} contacts`;
                } else if (tool.result.data.deals) {
                  const dealCount = tool.result.data.deals.length;
                  resultMessage = `Found ${dealCount} deals`;
                } else {
                  resultMessage = JSON.stringify(tool.result.data);
                }
              }
              detailedData = tool.result.data;
            } else if (typeof tool.result === 'string') {
              resultMessage = tool.result;
            } else {
              resultMessage = JSON.stringify(tool.result);
              detailedData = tool.result;
            }

            // Clean up the result message for display
            const cleanResult = resultMessage
              .replace(/Message sent to #([^:]+):/, '📤 Message sent to #$1')
              .replace(/Channel created: ([^,]+)/, '✅ Channel created: #$1')
              .replace(/Contact added: ([^,]+)/, '👤 Contact added: $1')
              .replace(/Deal created: ([^,]+)/, '💰 Deal created: $1')
              .replace(/Report generated: ([^,]+)/, '📊 Report generated: $1')
              .replace(/WhatsApp message sent to ([^:]+):/, '📱 WhatsApp message sent to $1')
              .replace(/Template sent to ([^:]+)/, '📋 Template sent to $1');

            formattedLines.push(
              <div key={`tool-result-${toolIndex}`} className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-purple-800 font-semibold text-sm">
                    {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
                
                {/* Display the actual result data */}
                <div className="text-purple-700 text-sm leading-relaxed mb-3">
                  {cleanResult}
                </div>

                {/* Display detailed result data if available */}
                {detailedData && typeof detailedData === 'object' && Object.keys(detailedData).length > 0 && (
                  <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                    <div className="text-purple-800 font-medium text-xs mb-2">📊 Detailed Results:</div>
                    <div className="space-y-2 text-xs">
                      {Object.entries(detailedData).map(([key, value]) => {
                        // Skip certain technical fields
                        if (['success', 'error', 'message'].includes(key)) return null;
                        
                        let displayValue = value;
                        if (Array.isArray(value)) {
                          displayValue = `${value.length} items`;
                        } else if (typeof value === 'object' && value !== null) {
                          displayValue = JSON.stringify(value, null, 2);
                        } else if (typeof value === 'string' && value.length > 100) {
                          displayValue = value.substring(0, 100) + '...';
                        }

                        return (
                          <div key={key} className="flex justify-between items-start">
                            <span className="font-medium text-purple-700 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-purple-600 text-right max-w-xs break-words">
                              {String(displayValue)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Special handling for channel lists */}
                    {detailedData.channels && Array.isArray(detailedData.channels) && (
                      <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                        <div className="text-purple-800 font-medium text-xs mb-2">📋 Channel List:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {detailedData.channels.slice(0, 10).map((channel: any, idx: number) => (
                            <div key={idx} className="text-xs text-purple-700 bg-white/50 p-1 rounded">
                              #{channel.name} ({channel.member_count} members)
                            </div>
                          ))}
                          {detailedData.channels.length > 10 && (
                            <div className="text-xs text-purple-600 italic">
                              ... and {detailedData.channels.length - 10} more channels
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Display metadata if available */}
                {tool.result.data && (
                  <div className="mt-2 text-xs text-purple-600 opacity-75">
                    {tool.result.data.channel && `Channel: ${tool.result.data.channel}`}
                    {tool.result.data.message_ts && ` • Message ID: ${tool.result.data.message_ts}`}
                    {tool.result.data.timestamp && ` • Time: ${new Date(tool.result.data.timestamp).toLocaleTimeString()}`}
                    {tool.result.data.success && ` • Status: Success`}
                    {tool.result.data.amount && ` • Amount: ${tool.result.data.amount}`}
                    {tool.result.data.contact_id && ` • Contact ID: ${tool.result.data.contact_id}`}
                    {tool.result.data.deal_id && ` • Deal ID: ${tool.result.data.deal_id}`}
                    {tool.result.data.phone_number && ` • Phone: ${tool.result.data.phone_number}`}
                  </div>
                )}

                {/* Display action details */}
                {tool.arguments && (
                  <div className="mt-2 p-2 bg-purple-100 rounded text-xs text-purple-700">
                    <div className="font-medium mb-1">🔧 Action Details:</div>
                    <div className="space-y-1">
                      {Object.entries(tool.arguments).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-purple-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          } else {
            // Show error results
            const errorMessage = tool.result.error || tool.result.message || 'Action failed';
            formattedLines.push(
              <div key={`tool-error-${toolIndex}`} className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-red-800 font-semibold text-sm">
                    {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
                <div className="text-red-700 text-sm leading-relaxed">
                  {errorMessage}
                </div>
                {tool.arguments && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                    <div className="font-medium mb-1">Attempted Action:</div>
                    <div className="space-y-1">
                      {Object.entries(tool.arguments).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-red-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
        }
      });
    }

    return formattedLines;
  };

  // Add welcome message when no messages exist
  const renderWelcomeMessage = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
          {/* Main Welcome Section */}
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                Welcome to Mini-Hub AI
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Your intelligent business assistant that connects all your tools and automates workflows. 
                Ask me anything about your business operations.
              </p>
            </div>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Communication */}
              <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Team Communication</h3>
                    <p className="text-sm text-gray-500">Slack & WhatsApp</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Send messages, create channels, manage team communications, and coordinate workflows.
                </p>
              </div>

              {/* CRM */}
              <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">CRM Management</h3>
                    <p className="text-sm text-gray-500">HubSpot Integration</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Manage contacts, create deals, track leads, and optimize your sales pipeline.
                </p>
              </div>

              {/* Analytics */}
              <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analytics & Insights</h3>
                    <p className="text-sm text-gray-500">GA4 & Reports</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Generate reports, analyze data, track performance, and get AI-powered insights.
                </p>
              </div>

              {/* File Management */}
              <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">File Management</h3>
                    <p className="text-sm text-gray-500">Documents & Media</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Upload, organize, and manage files. Generate PDFs, create content, and handle documents.
                </p>
              </div>

              {/* Web Tools */}
              <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-pink-200 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Web Tools</h3>
                    <p className="text-sm text-gray-500">Scraping & Research</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Scrape websites, extract data, research competitors, and gather market intelligence.
                </p>
              </div>

              {/* Content Creation */}
              <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Content Creation</h3>
                    <p className="text-sm text-gray-500">AI-Powered</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Generate content, create marketing materials, write copy, and design assets.
                </p>
              </div>
            </div>

            {/* Quick Start Examples */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">💡 Try these examples</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setInputMessage("Create a new Slack channel called 'marketing-team' and send a welcome message to the team")}
                  className="group text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">Team Setup</span>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-800">
                    "Create a new Slack channel called 'marketing-team' and send a welcome message to the team"
                  </p>
                </button>

                <button
                  onClick={() => setInputMessage("Add a new contact to HubSpot with name 'John Smith', email 'john@example.com', and company 'Tech Corp'")}
                  className="group text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">CRM Management</span>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-800">
                    "Add a new contact to HubSpot with name 'John Smith', email 'john@example.com', and company 'Tech Corp'"
                  </p>
                </button>

                <button
                  onClick={() => setInputMessage("Generate a weekly analytics report for our website and send it to the #analytics Slack channel")}
                  className="group text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">Analytics Report</span>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-800">
                    "Generate a weekly analytics report for our website and send it to the #analytics Slack channel"
                  </p>
                </button>

                <button
                  onClick={() => setInputMessage("Create a PDF report summarizing our Q4 sales performance and share it with the sales team")}
                  className="group text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-900">Document Creation</span>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-800">
                    "Create a PDF report summarizing our Q4 sales performance and share it with the sales team"
                  </p>
                </button>
              </div>
            </div>

            {/* Supported Tools Logos */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🛠️ Supported Tools & Platforms</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {/* Slack */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 15a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0-6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-6 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Slack</span>
                </div>

                {/* HubSpot */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">HubSpot</span>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                </div>

                {/* Google Analytics */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Google Analytics</span>
                </div>

                {/* File Management */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">File Management</span>
                </div>

                {/* Web Tools */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Web Tools</span>
                </div>

                {/* Content Creation */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Content Creation</span>
                </div>

                {/* Social Media */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Social Media</span>
                </div>

                {/* Workflow Builder */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Workflow Builder</span>
                </div>

                {/* API Management */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">API Management</span>
                </div>

                {/* Enterprise Security */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Enterprise Security</span>
                </div>

                {/* Multi-Tenant */}
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Multi-Tenant</span>
                </div>
              </div>
            </div>

            {/* Features Highlight */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">✨ What makes Mini-Hub special</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Multi-Tool Integration</h3>
                  <p className="text-gray-600 text-sm">
                    Seamlessly connect Slack, HubSpot, WhatsApp, Google Analytics, and more in one conversation.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Automation</h3>
                  <p className="text-gray-600 text-sm">
                    Automate complex workflows, generate reports, and create content with intelligent AI assistance.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-Time Results</h3>
                  <p className="text-gray-600 text-sm">
                    See live updates, structured data, and detailed results as tools execute in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Add a component to display downloadable files
  const renderFileDownloads = (message: Message) => {
    if (!message.tools_called || !showDetailedResults) return null;

    const fileDownloads: JSX.Element[] = [];

    message.tools_called.forEach((tool, index) => {
      if (tool.result && tool.result.success && tool.result.data) {
        const data = tool.result.data;
        
        // Check for file management results
        if (tool.name === 'file_management' && data.filename) {
          fileDownloads.push(
            <div key={`file-${index}`} className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-800">{data.filename}</div>
                    <div className="text-xs text-blue-600">
                      {data.size ? `${(data.size / 1024).toFixed(1)} KB` : 'Generated file'}
                    </div>
                  </div>
                </div>
                <a
                  href={`/api/chat/download/${message.conversation_id}/${message.id}/${data.filename}`}
                  download={data.filename}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Download
                </a>
              </div>
            </div>
          );
        }

        // Check for image generation results
        if (tool.name === 'content_creation' && data.image_url) {
          fileDownloads.push(
            <div key={`image-${index}`} className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-green-800">Generated Image</div>
                    <div className="text-xs text-green-600">AI-generated content</div>
                  </div>
                </div>
                <a
                  href={data.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                >
                  View
                </a>
              </div>
              {data.image_url && (
                <div className="mt-2">
                  <img 
                    src={data.image_url} 
                    alt="Generated content" 
                    className="max-w-full h-auto rounded-lg border"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
            </div>
          );
        }

        // Check for web scraping results
        if (tool.name === 'web_tools' && data.url) {
          fileDownloads.push(
            <div key={`web-${index}`} className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-purple-800">Web Data Extracted</div>
                    <div className="text-xs text-purple-600">{data.url}</div>
                  </div>
                </div>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Visit
                </a>
              </div>
              {data.title && (
                <div className="text-xs text-purple-700 mt-1">
                  <strong>Title:</strong> {data.title}
                </div>
              )}
            </div>
          );
        }
      }
    });

    return fileDownloads.length > 0 ? (
      <div className="space-y-2">
        {fileDownloads}
      </div>
    ) : null;
  };

  // Add a component to display structured data
  const renderStructuredData = (message: Message) => {
    if (!message.tools_called || !showDetailedResults) return null;

    const structuredData: JSX.Element[] = [];

    message.tools_called.forEach((tool, index) => {
      if (tool.result && tool.result.success && tool.result.data) {
        const data = tool.result.data;
        
        // Check for Slack channel data
        if (tool.name === 'slack_team_management' && data.channels) {
          structuredData.push(
            <div key={`slack-channels-${index}`} className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-800 font-semibold text-sm">Slack Channels</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {data.total_channels || data.channels.length} channels
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {data.channels.map((channel: any, channelIndex: number) => (
                  <div key={channelIndex} className="bg-white/70 p-3 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">#</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-blue-800">{channel.name}</div>
                          <div className="text-xs text-blue-600">{channel.member_count} members</div>
                        </div>
                      </div>
                      {channel.is_private && (
                        <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {channel.topic && (
                      <div className="text-xs text-blue-700 mb-1">
                        <strong>Topic:</strong> {channel.topic}
                      </div>
                    )}
                    
                    {channel.purpose && (
                      <div className="text-xs text-blue-600 line-clamp-2">
                        {channel.purpose}
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-500 mt-2">
                      ID: {channel.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        // Check for Slack file operations data
        if (tool.name === 'slack_file_operations' && data.files) {
          structuredData.push(
            <div key={`slack-files-${index}`} className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-green-800 font-semibold text-sm">Slack Files</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {data.total_files || data.files.length} files
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {data.files.map((file: any, fileIndex: number) => (
                  <div key={fileIndex} className="bg-white/70 p-3 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-800">{file.name}</div>
                        <div className="text-xs text-green-600">{file.filetype}</div>
                      </div>
                    </div>
                    
                    {file.title && (
                      <div className="text-xs text-green-700 mb-1">
                        <strong>Title:</strong> {file.title}
                      </div>
                    )}
                    
                    <div className="text-xs text-green-500">
                      Size: {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        // Check for Slack user groups data
        if (tool.name === 'slack_admin_tools' && data.groups) {
          structuredData.push(
            <div key={`slack-groups-${index}`} className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-purple-800 font-semibold text-sm">User Groups</span>
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  {data.total_groups || data.groups.length} groups
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {data.groups.map((group: any, groupIndex: number) => (
                  <div key={groupIndex} className="bg-white/70 p-3 rounded-lg border border-purple-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-purple-800">{group.name}</div>
                        <div className="text-xs text-purple-600">@{group.handle}</div>
                      </div>
                    </div>
                    
                    {group.description && (
                      <div className="text-xs text-purple-700 mb-1">
                        {group.description}
                      </div>
                    )}
                    
                    <div className="text-xs text-purple-500">
                      {group.member_count} members
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        // Check for Slack workspace analytics data
        if (tool.name === 'slack_workspace_management' && data.analytics) {
          structuredData.push(
            <div key={`slack-analytics-${index}`} className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-indigo-800 font-semibold text-sm">Workspace Analytics</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(data.analytics).map(([key, value]) => (
                  <div key={key} className="bg-white/50 p-3 rounded-lg border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg font-bold text-indigo-800">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        // Check for analytics data
        if ((tool.name === 'ga4_analytics_dashboard' || tool.name === 'hubspot_analytics') && data.summary) {
          structuredData.push(
            <div key={`analytics-${index}`} className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-indigo-800 font-semibold text-sm">Analytics Report</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(data.summary).map(([key, value]) => (
                  <div key={key} className="bg-white/50 p-3 rounded-lg border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg font-bold text-indigo-800">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Check for contact/deal data
        if ((tool.name === 'hubspot_contact_operations' || tool.name === 'hubspot_deal_management') && data.properties) {
          structuredData.push(
            <div key={`crm-${index}`} className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-green-800 font-semibold text-sm">
                  {tool.name.includes('contact') ? 'Contact Details' : 'Deal Information'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(data.properties).map(([key, value]) => (
                  <div key={key} className="bg-white/50 p-3 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm font-medium text-green-800">
                      {String(value || 'N/A')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Check for Slack channel/message data
        if (tool.name === 'slack_team_communication' && (data.channel || data.message_ts)) {
          structuredData.push(
            <div key={`slack-${index}`} className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-800 font-semibold text-sm">Slack Message</span>
              </div>
              
              <div className="space-y-2">
                {data.channel && (
                  <div className="bg-white/50 p-3 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Channel</div>
                    <div className="text-sm font-medium text-blue-800">{data.channel}</div>
                  </div>
                )}
                {data.message_ts && (
                  <div className="bg-white/50 p-3 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Message ID</div>
                    <div className="text-sm font-medium text-blue-800">{data.message_ts}</div>
                  </div>
                )}
                {data.timestamp && (
                  <div className="bg-white/50 p-3 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Sent At</div>
                    <div className="text-sm font-medium text-blue-800">
                      {new Date(data.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Check for WhatsApp message data
        if (tool.name === 'whatsapp_messaging' && (data.phone_number || data.message_id)) {
          structuredData.push(
            <div key={`whatsapp-${index}`} className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-green-800 font-semibold text-sm">WhatsApp Message</span>
              </div>
              
              <div className="space-y-2">
                {data.phone_number && (
                  <div className="bg-white/50 p-3 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 font-medium">Phone Number</div>
                    <div className="text-sm font-medium text-green-800">{data.phone_number}</div>
                  </div>
                )}
                {data.message_id && (
                  <div className="bg-white/50 p-3 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 font-medium">Message ID</div>
                    <div className="text-sm font-medium text-green-800">{data.message_id}</div>
                  </div>
                )}
                {data.timestamp && (
                  <div className="bg-white/50 p-3 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 font-medium">Sent At</div>
                    <div className="text-sm font-medium text-green-800">
                      {new Date(data.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Check for web scraping data
        if (tool.name === 'web_tools' && data.content) {
          structuredData.push(
            <div key={`web-data-${index}`} className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <span className="text-purple-800 font-semibold text-sm">Web Data</span>
              </div>
              
              <div className="space-y-2">
                {data.title && (
                  <div className="bg-white/50 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium">Title</div>
                    <div className="text-sm font-medium text-purple-800">{data.title}</div>
                  </div>
                )}
                {data.content && (
                  <div className="bg-white/50 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium">Content Preview</div>
                    <div className="text-sm text-purple-800 max-h-20 overflow-hidden">
                      {data.content.substring(0, 200)}...
                    </div>
                  </div>
                )}
                {data.links && data.links.length > 0 && (
                  <div className="bg-white/50 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium">Links Found</div>
                    <div className="text-sm text-purple-800">{data.links.length} links</div>
                  </div>
                )}
              </div>
            </div>
          );
        }
      }
    });

    return structuredData.length > 0 ? (
      <div className="space-y-3">
        {structuredData}
      </div>
    ) : null;
  };

  // Add a component to display raw JSON data for developers
  const renderRawData = (message: Message) => {
    if (!message.tools_called) return null;

    const rawDataElements: JSX.Element[] = [];

    message.tools_called.forEach((tool, index) => {
      if (tool.result) {
        rawDataElements.push(
          <details key={`raw-${index}`} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              🔧 Raw Data: {tool.name.replace(/_/g, ' ')}
            </summary>
            <div className="mt-2 p-3 bg-white rounded border">
              <div className="text-xs text-gray-600 mb-2">Tool Arguments:</div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(tool.arguments, null, 2)}
              </pre>
              
              <div className="text-xs text-gray-600 mt-3 mb-2">Tool Result:</div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(tool.result, null, 2)}
              </pre>
            </div>
          </details>
        );
      }
    });

    return rawDataElements.length > 0 ? (
      <div className="space-y-2">
        {rawDataElements}
      </div>
    ) : null;
  };

  // Add a component to display error details
  const renderErrorDetails = (message: Message) => {
    if (!message.tools_called) return null;

    const errorElements: JSX.Element[] = [];

    message.tools_called.forEach((tool, index) => {
      if (tool.result && !tool.result.success) {
        errorElements.push(
          <div key={`error-${index}`} className="mt-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <XCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-red-800 font-semibold text-sm">
                {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} - Error
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="bg-white/50 p-3 rounded-lg border border-red-100">
                <div className="text-xs text-red-600 font-medium">Error Message</div>
                <div className="text-sm font-medium text-red-800">
                  {tool.result.error || tool.result.message || 'Unknown error occurred'}
                </div>
              </div>
              
              {tool.result.details && (
                <div className="bg-white/50 p-3 rounded-lg border border-red-100">
                  <div className="text-xs text-red-600 font-medium">Error Details</div>
                  <div className="text-sm text-red-800">
                    {typeof tool.result.details === 'string' 
                      ? tool.result.details 
                      : JSON.stringify(tool.result.details, null, 2)
                    }
                  </div>
                </div>
              )}
              
              {tool.result.status_code && (
                <div className="bg-white/50 p-3 rounded-lg border border-red-100">
                  <div className="text-xs text-red-600 font-medium">Status Code</div>
                  <div className="text-sm font-medium text-red-800">{tool.result.status_code}</div>
                </div>
              )}
              
              {tool.arguments && (
                <div className="bg-white/50 p-3 rounded-lg border border-red-100">
                  <div className="text-xs text-red-600 font-medium">Attempted Action</div>
                  <div className="text-sm text-red-800">
                    {Object.entries(tool.arguments).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
    });

    return errorElements.length > 0 ? (
      <div className="space-y-3">
        {errorElements}
      </div>
    ) : null;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isLoading) {
      sendMessage();
      }
    }
  };

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  };

  const toggleVoiceRecording = () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      toast.success('Voice recording stopped');
    } else {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start voice recording');
      }
    }
  };

  // Helper function to render tool-specific data
  const renderToolSpecificData = (tool: any, data: any, message: Message) => {
    const toolName = tool.name;

    // Slack data
    if (toolName.includes('slack')) {
      if (data.channels) {
        return (
          <div className="space-y-2">
            <div className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Channels Found:</div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {data.channels.slice(0, 5).map((channel: any, idx: number) => (
                <div key={idx} className={`flex items-center justify-between p-2 rounded ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>#{channel.name}</span>
                  <span className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{channel.member_count} members</span>
                </div>
              ))}
              {data.channels.length > 5 && (
                <div className={`text-xs italic ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ... and {data.channels.length - 5} more channels
                </div>
              )}
            </div>
          </div>
        );
      }
      
      if (data.channel && data.message_ts) {
        return (
          <div className="space-y-2">
            <div className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Message Sent:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Channel:</span>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>#{data.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Message ID:</span>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>{data.message_ts}</span>
              </div>
            </div>
          </div>
        );
      }
    }

    // Lead Generation Tools
    if (toolName.includes('lead_scoring_engine')) {
      if (data.score !== undefined) {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                <div className="text-3xl font-bold text-purple-700 mb-1">{data.score}/100</div>
                <div className="text-sm text-purple-600">Score</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                <div className={`text-2xl font-bold capitalize mb-1 ${
                  data.qualification === 'hot' ? 'text-red-600' :
                  data.qualification === 'warm' ? 'text-orange-600' :
                  data.qualification === 'lukewarm' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {data.qualification}
                </div>
                <div className="text-sm text-purple-600">Qualification</div>
              </div>
            </div>
            {data.recommendations && data.recommendations.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-purple-800 mb-3">💡 Recommendations:</div>
                <div className="space-y-2">
                  {data.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                      <div className="font-semibold text-purple-800 text-sm">{rec.title}</div>
                      <div className="text-sm text-purple-600 mt-1">{rec.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    if (toolName.includes('customer_journey_mapping')) {
      if (data.journey_id) {
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
              <div className="text-center mb-3">
                <div className="text-sm text-blue-600 mb-1">Journey ID</div>
                <div className="text-lg font-bold text-blue-800">{data.journey_id}</div>
              </div>
            </div>
            
            {data.stages && (
              <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                <div className="text-sm font-semibold text-blue-800 mb-3">🗺️ Journey Stages:</div>
                <div className="flex items-center justify-center space-x-2">
                  {data.stages.map((stage: string, idx: number) => (
                    <div key={idx} className="flex items-center">
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {stage}
                      </div>
                      {idx < data.stages.length - 1 && (
                        <div className="mx-2 text-blue-400">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.touchpoints && data.touchpoints.length > 0 && (
              <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                <div className="text-sm font-semibold text-blue-800 mb-3">📱 Touchpoints:</div>
                <div className="space-y-2">
                  {data.touchpoints.slice(0, 5).map((tp: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm text-blue-700 capitalize">{tp.type}</span>
                      <span className="text-xs text-blue-600">via {tp.channel}</span>
                    </div>
                  ))}
                  {data.touchpoints.length > 5 && (
                    <div className="text-xs text-blue-600 italic text-center">
                      ... and {data.touchpoints.length - 5} more touchpoints
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    if (toolName.includes('predictive_analytics_engine')) {
      if (data.conversion_probability !== undefined) {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                <div className="text-3xl font-bold text-indigo-700 mb-1">{data.conversion_probability}%</div>
                <div className="text-sm text-indigo-600">Conversion Probability</div>
              </div>
              {data.forecast_period && (
                <div className="text-center p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                  <div className="text-lg font-bold text-indigo-700 mb-1">{data.forecast_period}</div>
                  <div className="text-sm text-indigo-600">Forecast Period</div>
                </div>
              )}
            </div>
            
            {data.trends && data.trends.length > 0 && (
              <div className="p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                <div className="text-sm font-semibold text-indigo-800 mb-3">📈 Trends:</div>
                <div className="space-y-2">
                  {data.trends.slice(0, 3).map((trend: any, idx: number) => (
                    <div key={idx} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="font-semibold text-indigo-800 text-sm">{trend.metric}</div>
                      <div className="text-sm text-indigo-600 mt-1">{trend.prediction}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    // HubSpot data
    if (toolName.includes('hubspot')) {
      if (data.properties) {
        return (
          <div className="space-y-2">
            <div className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Contact/Deal Details:</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.properties).slice(0, 6).map(([key, value]) => (
                <div key={key} className={`p-2 rounded ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <div className={`text-xs font-medium capitalize ${
                    isDarkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className={`text-xs truncate ${
                    isDarkMode ? 'text-green-300' : 'text-green-700'
                  }`}>
                    {String(value || 'N/A')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      if (data.contacts) {
        return (
          <div className="space-y-2">
            <div className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Contacts Found:</div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {data.contacts.slice(0, 5).map((contact: any, idx: number) => (
                <div key={idx} className={`flex items-center justify-between p-2 rounded ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>{contact.properties?.firstname || contact.properties?.email || 'Unknown'}</span>
                  <span className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{contact.properties?.email || 'No email'}</span>
                </div>
              ))}
              {data.contacts.length > 5 && (
                <div className={`text-xs italic ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ... and {data.contacts.length - 5} more contacts
                </div>
              )}
            </div>
          </div>
        );
      }
      
      if (data.deals) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Deals Found:</div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {data.deals.slice(0, 5).map((deal: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-green-100 rounded">
                  <span className="text-xs font-medium text-green-800">{deal.properties?.dealname || 'Unknown Deal'}</span>
                  <span className="text-xs text-green-600">${deal.properties?.amount || 0}</span>
                </div>
              ))}
              {data.deals.length > 5 && (
                <div className="text-xs text-green-600 italic">
                  ... and {data.deals.length - 5} more deals
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    // WhatsApp data
    if (toolName.includes('whatsapp')) {
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-green-600">Message Details:</div>
          <div className="space-y-1">
            {data.phone_number && (
              <div className="flex justify-between">
                <span className="text-xs text-green-700">Phone:</span>
                <span className="text-xs font-medium text-green-800">{data.phone_number}</span>
              </div>
            )}
            {data.message_id && (
              <div className="flex justify-between">
                <span className="text-xs text-green-700">Message ID:</span>
                <span className="text-xs font-medium text-green-800">{data.message_id}</span>
              </div>
            )}
            {data.status && (
              <div className="flex justify-between">
                <span className="text-xs text-green-700">Status:</span>
                <span className="text-xs font-medium text-green-800">{data.status}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // File management data
    if (toolName.includes('file_management')) {
      if (data.filename) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">File Generated:</div>
            <div className="flex items-center justify-between p-2 bg-green-100 rounded">
              <div>
                <div className="text-xs font-medium text-green-800">{data.filename}</div>
                {data.size && (
                  <div className="text-xs text-green-600">
                    {(data.size / 1024).toFixed(1)} KB
                  </div>
                )}
              </div>
              <a
                href={`/api/chat/download/${message.conversation_id}/${message.id}/${data.filename}`}
                download={data.filename}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        );
      }
    }

    // Web tools data
    if (toolName.includes('web_tools')) {
      if (data.url) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Web Data:</div>
            <div className="space-y-1">
              {data.title && (
                <div className="flex justify-between">
                  <span className="text-xs text-green-700">Title:</span>
                  <span className="text-xs font-medium text-green-800">{data.title}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-green-700">URL:</span>
                <a 
                  href={data.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-green-800 hover:underline"
                >
                  Visit Site
                </a>
              </div>
              {data.content && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 max-h-20 overflow-y-auto">
                  {data.content.substring(0, 200)}...
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    // Analytics data
    if (toolName.includes('analytics') || toolName.includes('ga4')) {
      if (data.summary) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Analytics Summary:</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.summary).slice(0, 4).map(([key, value]) => (
                <div key={key} className="p-2 bg-green-100 rounded">
                  <div className="text-xs font-medium text-green-800 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-green-700">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      if (data.report) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Report Generated:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-green-700">Report Type:</span>
                <span className="text-xs font-medium text-green-800">{data.report.type || 'Custom Report'}</span>
              </div>
              {data.report.metrics && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(data.report.metrics).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="p-2 bg-green-100 rounded">
                      <div className="text-xs font-medium text-green-800 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-green-700">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    // Power BI data
    if (toolName.includes('powerbi') || toolName.includes('power_bi')) {
      if (data.workspaces) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Power BI Workspaces:</div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {data.workspaces.slice(0, 5).map((workspace: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-green-100 rounded">
                  <span className="text-xs font-medium text-green-800">{workspace.name}</span>
                  <span className="text-xs text-green-600">{workspace.state}</span>
                </div>
              ))}
              {data.workspaces.length > 5 && (
                <div className="text-xs text-green-600 italic">
                  ... and {data.workspaces.length - 5} more workspaces
                </div>
              )}
            </div>
          </div>
        );
      }
      
      if (data.reports) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Power BI Reports:</div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {data.reports.slice(0, 5).map((report: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-green-100 rounded">
                  <span className="text-xs font-medium text-green-800">{report.name}</span>
                  <span className="text-xs text-green-600">{report.datasetId}</span>
                </div>
              ))}
              {data.reports.length > 5 && (
                <div className="text-xs text-green-600 italic">
                  ... and {data.reports.length - 5} more reports
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    // Content creation data
    if (toolName.includes('content_creation')) {
      if (data.image_url) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Image Generated:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-green-700">Image URL:</span>
                <a 
                  href={data.image_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-green-800 hover:underline"
                >
                  View Image
                </a>
              </div>
              {data.prompt && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                  Prompt: {data.prompt}
                </div>
              )}
            </div>
          </div>
        );
      }
      
      if (data.content) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Content Generated:</div>
            <div className="p-2 bg-gray-50 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
              {data.content}
            </div>
          </div>
        );
      }
    }

    // Payment data
    if (toolName.includes('payment') || toolName.includes('stripe') || toolName.includes('mpesa')) {
      if (data.payment_id) {
        return (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-600">Payment Processed:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-green-700">Payment ID:</span>
                <span className="text-xs font-medium text-green-800">{data.payment_id}</span>
              </div>
              {data.amount && (
                <div className="flex justify-between">
                  <span className="text-xs text-green-700">Amount:</span>
                  <span className="text-xs font-medium text-green-800">${data.amount}</span>
                </div>
              )}
              {data.status && (
                <div className="flex justify-between">
                  <span className="text-xs text-green-700">Status:</span>
                  <span className="text-xs font-medium text-green-800">{data.status}</span>
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    // Default fallback for any other tool data
    return (
      <div className="space-y-2">
        <div className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Result:</div>
        <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </div>
      </div>
    );
  };

  // Enhanced data visualization component
  const renderDataVisualization = (message: Message) => {
    if (!message.tools_called || !showDetailedResults) return null;

    const visualizationElements: JSX.Element[] = [];

    message.tools_called.forEach((tool, index) => {
      if (tool.result && tool.result.success && tool.result.data) {
        const data = tool.result.data;
        
        // Analytics data visualization
        if ((tool.name.includes('analytics') || tool.name.includes('ga4')) && data.summary) {
          visualizationElements.push(
            <div key={`analytics-viz-${index}`} className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-indigo-800">Analytics Dashboard</h3>
                  <p className="text-xs text-indigo-600">Key metrics and performance data</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(data.summary).map(([key, value]) => (
                  <div key={key} className="bg-white/70 p-3 rounded-lg border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-medium capitalize mb-1">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg font-bold text-indigo-800">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </div>
                    {typeof value === 'number' && value > 1000 && (
                      <div className="text-xs text-indigo-500">
                        {(value / 1000).toFixed(1)}k
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Slack channels visualization
        if (tool.name.includes('slack') && data.channels && Array.isArray(data.channels)) {
          visualizationElements.push(
            <div key={`slack-viz-${index}`} className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">Slack Workspace</h3>
                  <p className="text-xs text-blue-600">{data.channels.length} channels available</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {data.channels.slice(0, 9).map((channel: any, channelIndex: number) => (
                  <div key={channelIndex} className="bg-white/70 p-3 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">#</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-blue-800 truncate">{channel.name}</div>
                          <div className="text-xs text-blue-600">{channel.member_count} members</div>
                        </div>
                      </div>
                      {channel.is_private && (
                        <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {channel.topic && (
                      <div className="text-xs text-blue-700 mb-1 line-clamp-1">
                        {channel.topic}
                      </div>
                    )}
                  </div>
                ))}
                {data.channels.length > 9 && (
                  <div className="col-span-full text-center py-2">
                    <span className="text-xs text-blue-600 italic">
                      ... and {data.channels.length - 9} more channels
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // CRM data visualization
        if (tool.name.includes('hubspot') && data.properties) {
          visualizationElements.push(
            <div key={`crm-viz-${index}`} className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-green-800">
                    {tool.name.includes('contact') ? 'Contact Profile' : 'Deal Information'}
                  </h3>
                  <p className="text-xs text-green-600">CRM data and details</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(data.properties).map(([key, value]) => (
                  <div key={key} className="bg-white/70 p-3 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 font-medium capitalize mb-1">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm font-medium text-green-800 truncate">
                      {String(value || 'N/A')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // File management visualization
        if (tool.name.includes('file_management') && data.filename) {
          visualizationElements.push(
            <div key={`file-viz-${index}`} className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-orange-800">File Generated</h3>
                  <p className="text-xs text-orange-600">Document or media file created</p>
                </div>
              </div>
              
              <div className="bg-white/70 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-orange-800">{data.filename}</div>
                      {data.size && (
                        <div className="text-xs text-orange-600">
                          {(data.size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/api/chat/download/${message.conversation_id}/${message.id}/${data.filename}`}
                    download={data.filename}
                    className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          );
        }

        // Web scraping visualization
        if (tool.name.includes('web_tools') && data.url) {
          visualizationElements.push(
            <div key={`web-viz-${index}`} className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-purple-800">Web Data Extracted</h3>
                  <p className="text-xs text-purple-600">Information gathered from website</p>
                </div>
              </div>
              
              <div className="bg-white/70 p-4 rounded-lg border border-purple-100">
                <div className="space-y-3">
                  {data.title && (
                    <div>
                      <div className="text-xs text-purple-600 font-medium mb-1">Page Title</div>
                      <div className="text-sm font-medium text-purple-800">{data.title}</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-xs text-purple-600 font-medium mb-1">URL</div>
                    <a 
                      href={data.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-purple-800 hover:underline break-all"
                    >
                      {data.url}
                    </a>
                  </div>
                  
                  {data.content && (
                    <div>
                      <div className="text-xs text-purple-600 font-medium mb-1">Content Preview</div>
                      <div className="text-sm text-purple-700 max-h-20 overflow-hidden">
                        {data.content.substring(0, 200)}...
                      </div>
                    </div>
                  )}
                  
                  {data.links && data.links.length > 0 && (
                    <div>
                      <div className="text-xs text-purple-600 font-medium mb-1">Links Found</div>
                      <div className="text-sm text-purple-700">{data.links.length} links discovered</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
      }
    });

    return visualizationElements.length > 0 ? (
      <div className="space-y-4">
        {visualizationElements}
      </div>
    ) : null;
  };

  // Performance metrics component
  const renderPerformanceMetrics = (message: Message) => {
    if (!message.tools_called || message.tools_called.length === 0) return null;

    const totalTools = message.tools_called.length;
    const successfulTools = message.tools_called.filter(tool => tool.result?.success).length;
    const failedTools = totalTools - successfulTools;
    const successRate = totalTools > 0 ? ((successfulTools / totalTools) * 100).toFixed(1) : '0';

    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Performance Metrics</h3>
            <p className="text-xs text-gray-600">Tool execution efficiency and statistics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-1">Total Tools</div>
            <div className="text-lg font-bold text-gray-800">{totalTools}</div>
          </div>
          
          <div className="bg-white/70 p-3 rounded-lg border border-green-200">
            <div className="text-xs text-green-600 font-medium mb-1">Successful</div>
            <div className="text-lg font-bold text-green-800">{successfulTools}</div>
          </div>
          
          <div className="bg-white/70 p-3 rounded-lg border border-red-200">
            <div className="text-xs text-red-600 font-medium mb-1">Failed</div>
            <div className="text-lg font-bold text-red-800">{failedTools}</div>
          </div>
          
          <div className="bg-white/70 p-3 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 font-medium mb-1">Success Rate</div>
            <div className="text-lg font-bold text-blue-800">{successRate}%</div>
          </div>
        </div>
        
        {/* Tool-specific performance */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium text-gray-600 mb-2">Tool Performance Breakdown:</div>
          {message.tools_called.map((tool, index) => {
            const isSuccess = tool.result?.success;
            const executionTime = tool.result?.execution_time || 'N/A';
            
            return (
              <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isSuccess ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-xs font-medium ${
                    isSuccess ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${
                    isSuccess ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isSuccess ? 'Success' : 'Failed'}
                  </span>
                  {executionTime !== 'N/A' && (
                    <span className="text-xs text-gray-500">
                      {executionTime}ms
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Collapsible section component for better organization
  const CollapsibleSection = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-700">{title}</span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="p-4 bg-white">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Enhanced message organization component
  const renderOrganizedMessage = (message: Message) => {
    if (message.role !== 'assistant') {
      return (
        <div className={`whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </div>
      );
    }

    const hasTools = message.tools_called && message.tools_called.length > 0;
    const hasContent = message.content && message.content.trim().length > 0;

    return (
      <div className="space-y-4">
        {/* Quick Summary */}
        {renderMessageSummary(message)}
        
        {/* Actual Tool Results - Show prominently for lead generation tools */}
        {hasTools && (
          <div className="space-y-4">
            {message.tools_called?.map((tool, index) => {
              const isSuccess = tool.result?.success;
              const toolData = tool.result?.result || tool.result?.data || tool.result;
              
              // Check if this is a lead generation tool
              const isLeadGenerationTool = tool.name.includes('lead_scoring_engine') || 
                                        tool.name.includes('customer_journey_mapping') || 
                                        tool.name.includes('predictive_analytics_engine');
              
              if (isLeadGenerationTool && isSuccess && toolData) {
                // Show lead generation results prominently
                return (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                        {tool.name.includes('lead_scoring_engine') && <BarChart3 className="w-4 h-4 text-white" />}
                        {tool.name.includes('customer_journey_mapping') && <MapPin className="w-4 h-4 text-white" />}
                        {tool.name.includes('predictive_analytics_engine') && <Sparkles className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-purple-800">
                          {tool.name.includes('lead_scoring_engine') && 'Lead Scoring Results'}
                          {tool.name.includes('customer_journey_mapping') && 'Customer Journey Created'}
                          {tool.name.includes('predictive_analytics_engine') && 'Predictive Analytics'}
                        </h3>
                        <p className="text-sm text-purple-600">
                          {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    
                    {/* Render the actual tool results */}
                    {renderToolSpecificData(tool, toolData, message)}
                  </div>
                );
              } else {
                // Show generic tool summary for non-lead generation tools
                return (
                  <div key={index} className={`p-3 rounded-lg border ${
                    isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        isSuccess ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        isSuccess ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    {isSuccess && toolData && (
                      <div className="mt-2 text-xs text-gray-600">
                        {typeof toolData === 'string' ? toolData : 'Action completed successfully'}
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Message Content */}
        {hasContent && (
          <div className={`whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {formatMessage(message.content, message.tools_called)}
          </div>
        )}

        {/* Detailed Sections - Collapsible */}
        {hasTools && (
          <div className="space-y-3">
            <CollapsibleSection title="📊 Performance Metrics" defaultOpen={false}>
              {renderPerformanceMetrics(message)}
            </CollapsibleSection>
            
            <CollapsibleSection title="📈 Data Visualizations" defaultOpen={true}>
              {renderDataVisualization(message)}
            </CollapsibleSection>
            
            <CollapsibleSection title="📁 File Downloads" defaultOpen={true}>
              {renderFileDownloads(message)}
            </CollapsibleSection>
            
            <CollapsibleSection title="🔧 Structured Data" defaultOpen={false}>
              {renderStructuredData(message)}
            </CollapsibleSection>
            
            <CollapsibleSection title="🐛 Error Details" defaultOpen={false}>
              {renderErrorDetails(message)}
            </CollapsibleSection>
            
            <CollapsibleSection title="🔍 Raw Data (Developer)" defaultOpen={false}>
              {renderRawData(message)}
            </CollapsibleSection>
          </div>
        )}

        {/* Streaming indicator */}
        {message.status === 'processing' && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Generating response...
            </span>
          </div>
        )}
      </div>
    );
  };

  // Summary component for quick overview
  const renderMessageSummary = (message: Message) => {
    if (!message.tools_called || message.tools_called.length === 0) return null;

    const toolTypes = message.tools_called.map(tool => tool.name.split('_')[0]).filter((value, index, self) => self.indexOf(value) === index);
    const successfulCount = message.tools_called.filter(tool => tool.result?.success).length;
    const totalCount = message.tools_called.length;

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {toolTypes.slice(0, 3).map((toolType, index) => (
                <div key={index} className="w-4 h-4 text-gray-500">
                  {getToolIcon(toolType)}
                </div>
              ))}
              {toolTypes.length > 3 && (
                <span className="text-xs text-gray-500">+{toolTypes.length - 3}</span>
              )}
            </div>
            <span className="text-xs text-gray-600">
              {toolTypes.length} tool{toolTypes.length !== 1 ? 's' : ''} used
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-green-600">{successfulCount}/{totalCount} successful</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  };

  // Function to get the appropriate icon for each tool
  const getToolIcon = (toolName: string) => {
    const toolNameLower = toolName.toLowerCase();
    
    // Power BI tools
    if (toolNameLower.includes('powerbi') || toolNameLower.includes('power_bi')) {
      return <BarChart3 className="w-4 h-4" />;
    }
    
    // Slack tools
    if (toolNameLower.includes('slack')) {
      return <MessageSquare className="w-4 h-4" />;
    }
    
    // HubSpot tools
    if (toolNameLower.includes('hubspot')) {
      return <Database className="w-4 h-4" />;
    }
    
    // WhatsApp tools
    if (toolNameLower.includes('whatsapp')) {
      return <MessageCircle className="w-4 h-4" />;
    }
    
    // File management tools
    if (toolNameLower.includes('file_management') || toolNameLower.includes('file')) {
      return <FileText className="w-4 h-4" />;
    }
    
    // Web tools
    if (toolNameLower.includes('web_tools') || toolNameLower.includes('web')) {
      return <Globe className="w-4 h-4" />;
    }
    
    // Content creation tools
    if (toolNameLower.includes('content_creation') || toolNameLower.includes('content')) {
      return <Palette className="w-4 h-4" />;
    }
    
    // Analytics tools
    if (toolNameLower.includes('analytics') || toolNameLower.includes('ga4')) {
      return <BarChart3 className="w-4 h-4" />;
    }
    
    // Security tools
    if (toolNameLower.includes('security') || toolNameLower.includes('encrypt')) {
      return <Shield className="w-4 h-4" />;
    }
    
    // Payment tools
    if (toolNameLower.includes('payment') || toolNameLower.includes('stripe') || toolNameLower.includes('mpesa')) {
      return <CreditCard className="w-4 h-4" />;
    }
    
    // Social media tools
    if (toolNameLower.includes('facebook') || toolNameLower.includes('instagram') || toolNameLower.includes('twitter') || toolNameLower.includes('linkedin')) {
      return <Share2 className="w-4 h-4" />;
    }
    
    // Email tools
    if (toolNameLower.includes('email') || toolNameLower.includes('mail')) {
      return <Mail className="w-4 h-4" />;
    }
    
    // Phone/SMS tools
    if (toolNameLower.includes('sms') || toolNameLower.includes('phone')) {
      return <Phone className="w-4 h-4" />;
    }
    
    // Location tools
    if (toolNameLower.includes('location') || toolNameLower.includes('map')) {
      return <MapPin className="w-4 h-4" />;
    }
    
    // Media tools
    if (toolNameLower.includes('image') || toolNameLower.includes('photo')) {
      return <Image className="w-4 h-4" />;
    }
    if (toolNameLower.includes('video')) {
      return <Video className="w-4 h-4" />;
    }
    if (toolNameLower.includes('audio') || toolNameLower.includes('music')) {
      return <Music className="w-4 h-4" />;
    }
    
    // Download/Upload tools
    if (toolNameLower.includes('download')) {
      return <Download className="w-4 h-4" />;
    }
    if (toolNameLower.includes('upload')) {
      return <Upload className="w-4 h-4" />;
    }
    
    // Activity/Monitoring tools
    if (toolNameLower.includes('activity') || toolNameLower.includes('monitor')) {
      return <Activity className="w-4 h-4" />;
    }
    
    // Calendar/Scheduling tools
    if (toolNameLower.includes('calendar') || toolNameLower.includes('schedule')) {
      return <Calendar className="w-4 h-4" />;
    }
    
    // Lead Generation tools
    if (toolNameLower.includes('lead_scoring_engine') || toolNameLower.includes('lead_scoring')) {
      return <BarChart3 className="w-4 h-4" />;
    }
    if (toolNameLower.includes('customer_journey_mapping') || toolNameLower.includes('journey')) {
      return <MapPin className="w-4 h-4" />;
    }
    if (toolNameLower.includes('predictive_analytics_engine') || toolNameLower.includes('predictive')) {
      return <Sparkles className="w-4 h-4" />;
    }
    
    // Shopping/E-commerce tools
    if (toolNameLower.includes('shopping') || toolNameLower.includes('cart') || toolNameLower.includes('ecommerce')) {
      return <ShoppingCart className="w-4 h-4" />;
    }
    
    // Default icon for unknown tools
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'}`}>
      {/* Modern Enhanced Sidebar */}
      <div className={`chat-sidebar ${sidebarCollapsed ? 'w-16' : 'w-64'} ${isDarkMode ? 'bg-gray-800/30 border-gray-600/30' : 'bg-white/30 border-gray-200/30'} backdrop-blur-sm border-r flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Enhanced Header */}
        <div className={`chat-header ${sidebarCollapsed ? 'p-3' : 'p-6'} border-b ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200/30'}`}>
          <div className={`flex items-center justify-between ${sidebarCollapsed ? 'mb-3' : 'mb-6'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center justify-center">
                <button
                  onClick={handleBackToDashboard}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  title="Back to Dashboard"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all duration-200 hover:shadow-md ${isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`p-2 rounded-lg transition-all duration-200 hover:shadow-md ${isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-lg transition-all duration-200 hover:shadow-md ${isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } w-8 h-8 flex items-center justify-center`}
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 transition-transform duration-200 rotate-180" />
              </button>
            )}
          </div>
          
          {/* Enhanced Provider Selection */}
          {!sidebarCollapsed && (
            <div className="chat-provider-select space-y-2">
              <div className="relative">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent transition-all duration-200 ${isDarkMode
                      ? 'bg-gray-700/30 border-gray-600/30 text-gray-300'
                      : 'bg-gray-100/30 border-gray-300/30 text-gray-600'
                    } backdrop-blur-sm`}
                >
                  {providers?.all_providers?.map((provider) => (
                    <option 
                      key={provider.id} 
                      value={provider.id}
                      disabled={!provider.available}
                      className={!provider.available ? 'text-gray-400' : ''}
                    >
                      {provider.name} {!provider.available && '(Not Configured)'}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isProviderAvailable(selectedProvider) ? 'bg-green-400/60' : 'bg-red-400/60'}`}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Conversations List */}
        <div className="chat-conversations-list flex-1 overflow-y-auto">
          <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} space-y-4`}>
            {!sidebarCollapsed && Object.entries(groupConversationsByTime(conversations)).map(([groupName, groupConversations]) => (
              <div key={groupName} className="space-y-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider px-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {groupName}
                </h3>
                <div className="space-y-1">
                  {groupConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setCurrentConversation(conversation)}
                className={`group relative p-4 cursor-pointer transition-all duration-300 ${
                  currentConversation?.id === conversation.id
                    ? isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    : isDarkMode ? 'hover:text-gray-300 text-gray-400' : 'hover:text-gray-600 text-gray-500'
                }`}
              >
                {editingConversation === conversation.id ? (
                  // Edit mode
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateConversationTitle(conversation.id);
                        } else if (e.key === 'Escape') {
                          cancelEditingConversation();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => updateConversationTitle(conversation.id)}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={cancelEditingConversation}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  // Normal mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          currentConversation?.id === conversation.id
                            ? isDarkMode ? 'bg-gray-500/50 text-gray-200' : 'bg-gray-200/50 text-gray-600'
                            : isDarkMode 
                              ? 'bg-gray-600/30 text-gray-400'
                              : 'bg-gray-100/30 text-gray-500'
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-semibold truncate ${
                            currentConversation?.id === conversation.id
                              ? isDarkMode ? 'text-gray-200' : 'text-gray-700'
                              : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {conversation.title || 'New Conversation'}
                          </h3>
                          <p className={`text-xs mt-1 ${
                            currentConversation?.id === conversation.id
                              ? isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Options Menu */}
                    <div className="relative options-menu">
                      <button
                        onClick={(e) => handleOptionsMenuClick(conversation.id, e)}
                        className={`opacity-0 group-hover:opacity-100 p-2 transition-all duration-300 rounded-lg ${
                          currentConversation?.id === conversation.id
                            ? isDarkMode ? 'text-blue-200 hover:text-white hover:bg-blue-600/30' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100'
                            : isDarkMode
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Enhanced Dropdown Menu */}
                      {showOptionsMenu === conversation.id && (
                        <div className={`absolute right-0 top-8 z-50 w-40 border rounded-xl shadow-xl py-2 backdrop-blur-sm ${
                          isDarkMode
                            ? 'bg-gray-800/95 border-gray-600'
                            : 'bg-white/95 border-gray-200'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingConversation(conversation);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
                              isDarkMode
                                ? 'text-gray-200 hover:bg-gray-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            } transition-colors`}
                          >
                            <Edit size={16} />
                            <span>Edit Title</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(conversation.id);
                              setShowOptionsMenu(null);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
                              isDarkMode
                                ? 'text-red-400 hover:bg-red-900/20'
                                : 'text-red-600 hover:bg-red-50'
                            } transition-colors`}
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Collapsed Conversation List */}
            {sidebarCollapsed && (
              <div className="space-y-2">
                {conversations
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 8)
                  .map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setCurrentConversation(conversation)}
                    className={`group relative p-2 cursor-pointer transition-all duration-300 rounded-lg ${
                      currentConversation?.id === conversation.id
                        ? isDarkMode ? 'bg-blue-500/20 text-white' : 'bg-blue-500/20 text-blue-700'
                        : isDarkMode ? 'hover:bg-gray-700/30 text-gray-400' : 'hover:bg-gray-100/50 text-gray-600'
                    }`}
                    title={conversation.title || 'New Conversation'}
                  >
                    <div className="flex items-center justify-center">
                      <MessageSquare className={`w-4 h-4 ${currentConversation?.id === conversation.id ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                  </div>
                ))}
                {conversations.length > 8 && (
                  <div className="flex items-center justify-center p-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-200/50 text-gray-600'
                    }`}>
                      +{conversations.length - 8}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced New Conversation Button */}
        <div className={`chat-new-conversation ${sidebarCollapsed ? 'p-2' : 'p-4'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200/50'}`}>
          <button
            onClick={() => setShowNewConversationModal(true)}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
            } ${sidebarCollapsed ? 'p-2' : ''}`}
            title={sidebarCollapsed ? 'New Conversation' : undefined}
          >
            {!sidebarCollapsed && (
              <>
                <Sparkles size={18} />
                <span>New Conversation</span>
              </>
            )}
            {sidebarCollapsed && <Sparkles size={20} />}
          </button>
        </div>
      </div>

      {/* Enhanced Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header with Actions */}
        {currentConversation && hasToolCallsForWorkflow() && (
          <div className={`chat-workflow-header px-8 py-3 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`chat-tools-executed flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
              }`}>
                <CheckCircle size={14} />
                <span>{getSuccessfulToolCallCount()} tool{getSuccessfulToolCallCount() !== 1 ? 's' : ''} executed</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenWorkflowBuilder}
                className={`chat-save-workflow-btn flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg' 
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-md'
                }`}
              >
                <Save size={16} />
                <span>Save as Workflow</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Enhanced Messages Area */}
        <div className="chat-messages-area flex-1 overflow-y-auto p-8 space-y-8">
          {renderWelcomeMessage()}
          {currentConversation ? (
            <>
              {messages
                .filter(message => {
                  // For assistant messages, only show the current version
                  if (message.role === 'assistant') {
                    const hasVersions = messageVersions[message.id] && messageVersions[message.id].length > 0;
                    if (hasVersions) {
                      // Only show this message if it's the current version
                      const currentResponse = getCurrentResponse(message.id);
                      return currentResponse && message.id === currentResponse.id;
                    }
                  }
                  // Always show user messages
                  return true;
                })
                .map((message, index) => {
                  // Check if this message has multiple versions
                  const hasVersions = messageVersions[message.id] && messageVersions[message.id].length > 0;
                  
                  return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-center'} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`flex ${message.role === 'user' ? 'max-w-2xl' : 'max-w-4xl w-full'}`}>
                    {/* Enhanced Avatar - Only show for user messages */}
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <User size={20} />
                      </div>
                    )}

                    {/* Enhanced Message Content */}
                    <div className="flex-1">
                      <div className={`p-6 rounded-2xl ${
                        message.role === 'user'
                          ? isDarkMode
                            ? 'bg-blue-600/20 text-white border border-blue-500/30'
                            : 'bg-blue-50/50 text-blue-900 border border-blue-200/50'
                          : isDarkMode
                            ? 'text-gray-200'
                            : 'text-gray-900'
                      }`}>
                        {editingMessage === message.id ? (
                          // Edit mode for user messages
                          <div className="space-y-3">
                            <textarea
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  saveEditedMessage();
                                } else if (e.key === 'Escape') {
                                  cancelEditingMessage();
                                }
                              }}
                              className={`w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed ${
                                isDarkMode
                                  ? 'bg-gray-700/50 text-white border border-gray-600'
                                  : 'bg-white/90 text-gray-900 border border-gray-300'
                              }`}
                              rows={Math.max(2, editingMessageText.split('\n').length)}
                              autoFocus
                            />
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={cancelEditingMessage}
                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                  isDarkMode
                                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={resendEditedMessage}
                                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Normal message display
                          <div className="group relative">
                                                    <div className={`text-sm leading-relaxed ${
                          message.role === 'user' 
                            ? isDarkMode ? 'text-white' : 'text-blue-900' 
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {message.role === 'assistant' && hasVersions
                            ? renderOrganizedMessage(getCurrentResponse(message.id) || message)
                            : renderOrganizedMessage(message)
                          }
                        </div>
                          </div>
                        )}
                      </div>
                    
                      {/* Enhanced Message Metadata */}
                      <div className={`text-xs mt-4 flex items-center justify-between ${
                        message.role === 'user'
                          ? isDarkMode ? 'text-blue-200' : 'text-blue-600'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <span>{formatTime(message.created_at)}</span>
                          {message.tokens_used && (
                            <span>• {message.tokens_used} tokens</span>
                          )}
                        </div>
                        
                        {/* Action buttons for user messages */}
                        {message.role === 'user' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                toast.success('Message copied to clipboard');
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDarkMode
                                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Copy message"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => startEditingMessage(message)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDarkMode
                                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Edit message"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        )}
                        
                        {/* Version navigation for assistant messages with multiple responses */}
                        {message.role === 'assistant' && hasVersions && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => switchVersion(message.id, Math.max(0, (currentVersion[message.id] || 0) - 1))}
                              disabled={(currentVersion[message.id] || 0) <= 0}
                              className={`p-1 rounded transition-colors ${
                                (currentVersion[message.id] || 0) <= 0
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : isDarkMode
                                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Previous version"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <span className={`text-xs px-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {(currentVersion[message.id] || 0) + 1}/{messageVersions[message.id].length + 1}
                            </span>
                            <button
                              onClick={() => switchVersion(message.id, Math.min(messageVersions[message.id].length, (currentVersion[message.id] || 0) + 1))}
                              disabled={(currentVersion[message.id] || 0) >= messageVersions[message.id].length}
                              className={`p-1 rounded transition-colors ${
                                (currentVersion[message.id] || 0) >= messageVersions[message.id].length
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : isDarkMode
                                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Next version"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
              
              {/* Enhanced Loading Animation */}
              {isLoading && (
                <div className="flex justify-center animate-fade-in">
                  <div className="flex max-w-4xl w-full">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Bot size={20} />
                    </div>
                    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl px-6 py-4 shadow-lg`}>
                      <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Processing your request...
                        </div>
                      </div>
                      <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Connecting to your business tools and preparing response
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ready to chat</h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Start typing to begin chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Input Area - Modern ChatGPT Style */}
        <div className={`chat-input-area ${isDarkMode ? 'bg-gray-800/95' : ''} backdrop-blur-sm`}>
          <div className="max-w-4xl mx-auto p-6">
            <div className="relative">
              {/* Enhanced Input Container */}
              <div className={`chat-input-container relative border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 focus-within:border-blue-500 focus-within:shadow-xl ${
                isDarkMode
                  ? 'bg-gray-800/20 border-gray-600/50'
                  : 'bg-white/20 border-gray-300/50'
              } backdrop-blur-sm`}>
                {/* Enhanced Textarea */}
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    autoResizeTextarea(e);
                  }}
                  className={`chat-input w-full min-h-[60px] max-h-40 px-6 py-4 pr-12 resize-none border-0 outline-none bg-transparent text-sm leading-relaxed ${
                    isDarkMode
                      ? 'text-gray-200 placeholder-gray-400'
                      : 'text-gray-900 placeholder-gray-500'
                  }`}
                  onKeyPress={handleKeyPress}
                  placeholder="Start typing your message..."
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                />

                {/* Enhanced Bottom Actions Bar */}
                <div className={`flex items-center justify-between px-6 py-3 border-t rounded-b-2xl ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-600/50'
                    : 'border-gray-100 bg-gray-50/50'
                }`}>
                  <div className="flex items-center space-x-3">
                    {/* Enhanced Attachment Button */}
                    <button
                      className={`p-2.5 transition-colors duration-200 rounded-lg hover:shadow-md ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Attach file"
                    >
                      <Paperclip size={18} />
                    </button>

                    {/* Enhanced Voice Input Button */}
                    <button
                      onClick={toggleVoiceRecording}
                      className={`voice-input-btn p-2.5 transition-colors duration-200 rounded-lg hover:shadow-md ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : isDarkMode
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title={isRecording ? "Stop recording" : "Start voice input"}
                    >
                      <Mic size={18} />
                    </button>

                    {/* Enhanced Emoji Button */}
                    <button
                      className={`p-2.5 transition-colors duration-200 rounded-lg hover:shadow-md ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Add emoji"
                    >
                      <Smile size={18} />
                    </button>
                  </div>

                  {/* Enhanced Send Button */}
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className={`chat-send-btn flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      inputMessage.trim() && !isLoading
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                        : isDarkMode
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced Character Counter and Recording Indicator */}
              <div className={`absolute -bottom-8 right-0 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {isRecording && (
                  <div className="flex items-center space-x-2 text-red-500 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Recording...</span>
                  </div>
                )}
                {inputMessage.length > 0 && !isRecording && (
                  <span>{inputMessage.length} characters</span>
                )}
              </div>

              {/* Enhanced Provider Info */}
              <div className={`mt-4 flex items-center justify-between text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                <div className="flex items-center space-x-3">
                  <span>Using:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {getProviderDisplayName(selectedProvider)}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${isProviderAvailable(selectedProvider) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>

                {/* Enhanced Keyboard Shortcuts */}
                <div className={`flex items-center space-x-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                  <span>Enter to send</span>
                  <span>Shift+Enter for new line</span>
                  <span>Click mic for voice input</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced New Conversation Modal */}
        {showNewConversationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform animate-scale-in">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Create New Conversation</h3>
              </div>
              <input
                type="text"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                placeholder="Enter conversation title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createNewConversation()}
                autoFocus
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewConversation}
                  disabled={!newConversationTitle.trim()}
                  className={`px-6 py-2 rounded-xl transition-all duration-300 ${
                    newConversationTitle.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform animate-scale-in">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Conversation</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => showDeleteConfirm && deleteConversation(showDeleteConfirm)}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Custom CSS for animations and improvements */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes scale-in {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in {
              animation: fade-in 0.3s ease-out;
            }
            .animate-scale-in {
              animation: scale-in 0.2s ease-out;
            }
            
            /* Enhanced visual hierarchy */
            .tool-execution-card {
              transition: all 0.2s ease-in-out;
            }
            .tool-execution-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            /* Better data visualization */
            .data-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
            }
            
            /* Enhanced collapsible sections */
            .collapsible-section {
              border-radius: 0.75rem;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .collapsible-section button {
              transition: all 0.2s ease-in-out;
            }
            
            .collapsible-section button:hover {
              background-color: #f8fafc;
            }
            
            /* Enhanced tool status indicators */
            .tool-status {
              display: inline-flex;
              align-items: center;
              padding: 0.375rem 0.75rem;
              border-radius: 0.5rem;
              font-size: 0.75rem;
              font-weight: 600;
              transition: all 0.2s ease-in-out;
            }
            
            .tool-status.success {
              background-color: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            
            .tool-status.error {
              background-color: #fee2e2;
              color: #991b1b;
              border: 1px solid #fecaca;
            }
            
            /* Enhanced data cards */
            .data-card {
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
              backdrop-filter: blur(15px);
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 1rem;
              padding: 1.25rem;
              transition: all 0.3s ease-in-out;
            }
            
            .data-card:hover {
              transform: translateY(-3px);
              box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
            }
            
            /* Enhanced performance metrics */
            .metric-card {
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              border: 1px solid #e2e8f0;
              border-radius: 0.75rem;
              padding: 1rem;
              text-align: center;
              transition: all 0.3s ease-in-out;
            }
            
            .metric-card:hover {
              transform: scale(1.03);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }
            
            /* Enhanced scrolling for long content */
            .scrollable-content {
              max-height: 500px;
              overflow-y: auto;
              scrollbar-width: thin;
              scrollbar-color: #cbd5e1 #f1f5f9;
            }
            
            .scrollable-content::-webkit-scrollbar {
              width: 8px;
            }
            
            .scrollable-content::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 4px;
            }
            
            .scrollable-content::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 4px;
            }
            
            .scrollable-content::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `
        }} />
      </div>
      
      {/* Workflow Builder Modal */}
      {showWorkflowBuilder && currentConversation && (
        <WorkflowBuilderModal
          open={showWorkflowBuilder}
          onClose={() => setShowWorkflowBuilder(false)}
          conversationId={currentConversation.id}
          toolCalls={extractedToolCalls}
          onWorkflowCreated={handleWorkflowCreated}
          onCreateAgent={handleCreateAgentFromWorkflow}
        />
      )}
      
      {/* Agent Creator Modal */}
      {showAgentCreator && createdWorkflowId && (
        <AgentCreatorModal
          open={showAgentCreator}
          onClose={() => {
            setShowAgentCreator(false);
            setCreatedWorkflowId(null);
          }}
          workflowId={createdWorkflowId}
          onAgentCreated={handleAgentCreated}
        />
      )}
    </div>
  );
};

export default Chat; 