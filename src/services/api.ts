import axios, { AxiosInstance } from 'axios';
import {
  AgentCreate,
  AgentResponse,
  AgentStatusResponse,
  ApiResponse,
  APISettings,
  ChatToolsResponse,
  Connection,
  ConnectionCreate,
  ConnectionPlatform,
  ConnectionUpdate,
  ContentCreationResponse,
  Conversation,
  ConversationCreate,
  DashboardSettings,
  ImageGenerationResponse,
  IntegrationSettings,
  LLMProviderResponse,
  MCPTool,
  Message,
  MessageCreate,
  MpesaAgentConfig,
  MpesaPayment,
  MpesaPaymentListResponse,
  MpesaPaymentRequest,
  MpesaPaymentSummary,
  NotificationSettings,
  Payment,
  PaymentVerificationRequest,
  PDFGenerationResponse,
  PricingTiers,
  SecuritySettings,
  ServerInfo,
  ServerStatus,
  ShortLinkResponse,
  StripeCustomerRequest,
  StripePaymentRequest,
  Subscription,
  ToolInfo,
  UsageLog,
  User,
  UserSettings,
  UserSettingsUpdate,
  WebScrapingResponse,
  // New types for enhanced features
  Workflow,
  WorkflowCreateRequest,
  WorkflowExecuteRequest,
  WorkflowTemplate
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Use production URL or fallback to environment variable
    const getBaseURL = () => {
      const envURL = process.env.REACT_APP_API_URL;
      if (envURL) return envURL;
      // Default to production API
      return 'https://mini-hub.fly.dev';
    };

    this.api = axios.create({
      baseURL: getBaseURL(),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string, rememberMe: boolean = false): Promise<ApiResponse<any>> {
    const response = await this.api.post('/auth/login', { email, password, remember_me: rememberMe });
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/auth/register', { email, password, name });
    return response.data;
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async getUsageStats(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/subscription/usage');
    return response.data;
  }

  async updateUser(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put('/auth/me', data);
    return response.data;
  }

  async regenerateApiKey(): Promise<ApiResponse<{ api_key: string; message: string }>> {
    const response = await this.api.post('/auth/me/regenerate-api-key');
    return response.data;
  }

  // Authentication methods
  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  }

  async validateResetToken(token: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/auth/validate-reset-token', { token });
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  }

  // Access Request endpoints
  async requestAccess(email: string, name?: string, reason?: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/access/request', { email, name, reason });
    return response.data;
  }

  async getAccessStatus(email: string): Promise<ApiResponse<any>> {
    const response = await this.api.get('/access/status', { params: { email } });
    return response.data;
  }

  async getAccessRequests(status?: string): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/access/requests', { params: { status } });
    return response.data;
  }

  async approveAccess(email: string, action: 'approve' | 'reject'): Promise<ApiResponse<any>> {
    const response = await this.api.post('/access/approve', { email, action });
    return response.data;
  }

  // Connection endpoints
  async getConnections(): Promise<ApiResponse<Connection[]>> {
    const response = await this.api.get(`/connections?_t=${new Date().getTime()}`);
    return response.data;
  }

  async createConnection(data: ConnectionCreate): Promise<ApiResponse<Connection>> {
    const response = await this.api.post('/connections', data);
    return response.data;
  }

  async updateConnection(id: number, data: ConnectionUpdate): Promise<ApiResponse<Connection>> {
    const response = await this.api.put(`/connections/${id}`, data);
    return response.data;
  }

  async deleteConnection(id: number): Promise<void> {
    await this.api.delete(`/connections/${id}`);
  }

  async testConnection(id: number): Promise<ApiResponse<{ status: string; message: string }>> {
    const response = await this.api.post(`/connections/${id}/test`);
    return response.data;
  }

  async getAvailablePlatforms(): Promise<ApiResponse<ConnectionPlatform[]>> {
    const response = await this.api.get('/connections/platforms');
    // Backend returns { success: true, data: { platforms: [...] } }
    const platformsData = response.data?.data?.platforms || response.data?.platforms || [];
    return {
      success: true,
      data: platformsData
    };
  }

  // Google Workspace OAuth endpoints
  async getGoogleWorkspaceAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/google-workspace/auth-url');
    return response.data;  // Backend returns {auth_url, state} directly
  }

  async getGoogleWorkspaceCallback(code: string, state: string): Promise<{ success: boolean; error?: string }> {
    const response = await this.api.get(`/api/google-workspace/callback?code=${code}&state=${state}`);
    return response.data;  // Backend returns {success, error?} directly
  }

  // Slack OAuth endpoints
  async getSlackAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/slack/auth-url');
    return response.data;
  }

  async getSlackCallback(code: string, state: string): Promise<{ success: boolean; error?: string; team_name?: string }> {
    const response = await this.api.get(`/api/slack/callback?code=${code}&state=${state}`);
    return response.data;
  }

  // WhatsApp OAuth endpoints
  async getWhatsAppAuthUrl(): Promise<{ url: string }> {
    const response = await this.api.get('/api/whatsapp/auth-url');
    // The backend returns { url: "..." }
    return response.data;
  }

  // Facebook OAuth endpoints
  async getFacebookAuthUrl(): Promise<{ url: string }> {
    const response = await this.api.get('/api/facebook/auth-url');
    return response.data;
  }

  // Instagram OAuth endpoints
  async getInstagramAuthUrl(): Promise<{ url: string }> {
    const response = await this.api.get('/api/instagram/auth-url');
    return response.data;
  }

  // Twitter OAuth endpoints
  async getTwitterAuthUrl(): Promise<{ url: string }> {
    const response = await this.api.get('/api/twitter/auth-url');
    return response.data;
  }

  async getClickUpAuthUrl(): Promise<{ url: string }> {
    const response = await this.api.get('/api/clickup/auth-url');
    return response.data;
  }

  // Microsoft Teams OAuth endpoints
  async getTeamsAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/teams/auth-url');
    return response.data;
  }

  async getTeamsCallback(code: string, state: string): Promise<{ success: boolean; message?: string; connection_id?: number }> {
    const response = await this.api.get(`/api/teams/callback?code=${code}&state=${state}`);
    return response.data;
  }

  // Outlook OAuth endpoints
  async getOutlookAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/outlook/auth-url');
    return response.data;
  }

  async getOutlookCallback(code: string, state: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.api.get(`/api/outlook/callback?code=${code}&state=${state}`);
    return response.data;
  }

  // Notion OAuth endpoints
  async getNotionAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/notion/auth-url');
    return response.data;
  }

  async getNotionCallback(code: string, state: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.api.get(`/api/notion/callback?code=${code}&state=${state}`);
    return response.data;
  }

  // Trello OAuth endpoints
  async getTrelloAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/trello/auth-url');
    return response.data;
  }

  async getTrelloCallback(code: string, state: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.api.get(`/api/trello/callback?code=${code}&state=${state}`);
    return response.data;
  }

  // Jira OAuth endpoints
  async getJiraAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/jira/auth-url');
    return response.data;
  }

  async getJiraCallback(code: string, state: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.api.get(`/api/jira/callback?code=${code}&state=${state}`);
    return response.data;
  }

  // Zoom OAuth endpoints
  async getZoomAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await this.api.get('/api/zoom/auth-url');
    return response.data;
  }

  async getZoomCallback(code: string, state: string): Promise<{ success: boolean; message?: string; connection_id?: number }> {
    const response = await this.api.get(`/api/zoom/callback?code=${code}&state=${state}`);
    return response.data;
  }

  // Dynamic Tool Registry endpoints
  async getDynamicTools(): Promise<ApiResponse<ToolInfo[]>> {
    const response = await this.api.get('/mcp/tools/dynamic');
    return response.data;
  }

  async getUserTools(): Promise<ApiResponse<ToolInfo[]>> {
    const response = await this.api.get('/mcp/tools/user');
    return response.data;
  }

  async getToolCategories(): Promise<ApiResponse<string[]>> {
    const response = await this.api.get('/mcp/tools/categories');
    return response.data;
  }

  // MCP Tools endpoints
  async getMCPTools(includeAll: boolean = false): Promise<ApiResponse<MCPTool[]>> {
    const response = await this.api.get('/mcp/tools', {
      params: {
        include_all: includeAll,
        all: includeAll // Synonym for backward compatibility
      }
    });
    // Backend returns { success: true, data: { tools: [...] } }
    const toolsData = response.data?.data?.tools || response.data?.tools || [];
    return {
      success: true,
      data: toolsData
    };
  }

  async executeMCPTool(toolName: string, params: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: toolName,
      arguments: params
    });
    return response.data;
  }

  // Chat Tools endpoints
  async getChatTools(): Promise<ApiResponse<ChatToolsResponse>> {
    const response = await this.api.get('/chat/tools');
    return response.data;
  }

  // Enhanced HubSpot endpoints
  async hubspotContactOperations(operation: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'hubspot_contact_operations',
      arguments: {
        operation,
        ...data
      }
    });
    return response.data;
  }

  async hubspotDealManagement(operation: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'hubspot_deal_management',
      arguments: {
        operation,
        ...data
      }
    });
    return response.data;
  }

  async hubspotAnalytics(startDate?: string, endDate?: string, metrics?: string[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'hubspot_analytics',
      arguments: {
        start_date: startDate,
        end_date: endDate,
        metrics: metrics || []
      }
    });
    return response.data;
  }

  // Enhanced GA4 endpoints
  async ga4AnalyticsDashboard(reportType: string, dateRange?: string, metrics?: string[], dimensions?: string[], filters?: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'ga4_analytics_dashboard',
      arguments: {
        report_type: reportType,
        date_range: dateRange || 'last_30_days',
        metrics: metrics || [],
        dimensions: dimensions || [],
        filters: filters || {}
      }
    });
    return response.data;
  }

  async ga4UserBehavior(hours?: number, userSegments?: string[], engagementMetrics?: string[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'ga4_user_behavior',
      arguments: {
        hours: hours || 24,
        user_segments: userSegments || [],
        engagement_metrics: engagementMetrics || []
      }
    });
    return response.data;
  }

  // Enhanced Slack endpoints
  async slackTeamCommunication(action: string, channel: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'slack_team_communication',
      arguments: {
        action,
        channel,
        ...data
      }
    });
    return response.data;
  }

  async slackTeamManagement(operation: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'slack_team_management',
      arguments: {
        operation,
        ...data
      }
    });
    return response.data;
  }

  // Campaign automation endpoints
  async marketingCampaignAutomation(campaignType: string, targetAudience: Record<string, any>, content: Record<string, any>, schedule: Record<string, any>, optimizationRules: Record<string, any>, platforms: string[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'marketing_campaign_automation',
      arguments: {
        campaign_type: campaignType,
        target_audience: targetAudience,
        content,
        schedule,
        optimization_rules: optimizationRules,
        platforms
      }
    });
    return response.data;
  }

  async campaignPerformanceTracking(campaignId: string, metrics?: string[], dateRange?: string, channels?: string[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'campaign_performance_tracking',
      arguments: {
        campaign_id: campaignId,
        metrics: metrics || [],
        date_range: dateRange,
        channels: channels || []
      }
    });
    return response.data;
  }

  // File Management endpoints
  async fileManagement(operation: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'file_management',
      arguments: {
        operation,
        ...data
      }
    });
    return response.data;
  }

  async uploadFile(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post('/mcp/call', {
      name: 'file_management',
      arguments: {
        operation: 'upload',
        file: formData
      }
    });
    return response.data;
  }

  async downloadFile(filename: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'file_management',
      arguments: {
        operation: 'download',
        filename
      }
    });
    return response.data;
  }

  async generatePDF(content: string, template?: string): Promise<ApiResponse<PDFGenerationResponse>> {
    const response = await this.api.post('/mcp/call', {
      name: 'file_management',
      arguments: {
        operation: 'generate_pdf',
        content,
        template: template || 'default'
      }
    });
    return response.data;
  }

  async generateQRCode(data: string, size: number = 10): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'file_management',
      arguments: {
        operation: 'generate_qr',
        qr_data: data,
        qr_size: size
      }
    });
    return response.data;
  }

  async convertDocument(content: string, fromFormat: string, toFormat: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'file_management',
      arguments: {
        operation: 'convert_document',
        content,
        from_format: fromFormat,
        to_format: toFormat
      }
    });
    return response.data;
  }

  // Web Tools endpoints
  async webTools(operation: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'web_tools',
      arguments: {
        operation,
        ...data
      }
    });
    return response.data;
  }

  async scrapeWebsite(url: string, selectors?: Record<string, string>, useSelenium?: boolean): Promise<ApiResponse<WebScrapingResponse>> {
    const response = await this.api.post('/mcp/call', {
      name: 'web_tools',
      arguments: {
        operation: 'scrape_website',
        url,
        selectors: selectors || {},
        use_selenium: useSelenium || false
      }
    });
    return response.data;
  }

  async generateShortLink(originalUrl: string, customAlias?: string): Promise<ApiResponse<ShortLinkResponse>> {
    const response = await this.api.post('/mcp/call', {
      name: 'web_tools',
      arguments: {
        operation: 'generate_short_link',
        original_url: originalUrl,
        custom_alias: customAlias
      }
    });
    return response.data;
  }

  async generateTrackingLink(originalUrl: string, campaign?: string, source?: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'web_tools',
      arguments: {
        operation: 'generate_tracking_link',
        original_url: originalUrl,
        campaign,
        source
      }
    });
    return response.data;
  }

  async checkWebsiteStatus(url: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'web_tools',
      arguments: {
        operation: 'check_status',
        url
      }
    });
    return response.data;
  }

  async extractEmailsFromWebsite(url: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'web_tools',
      arguments: {
        operation: 'extract_emails',
        url
      }
    });
    return response.data;
  }

  // Content Creation endpoints
  async contentCreation(operation: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'content_creation',
      arguments: {
        operation,
        ...data
      }
    });
    return response.data;
  }

  async generateImage(text: string, style?: string, size?: { width: number; height: number }): Promise<ApiResponse<ImageGenerationResponse>> {
    const response = await this.api.post('/mcp/call', {
      name: 'content_creation',
      arguments: {
        operation: 'generate_image',
        text,
        style: style || 'modern',
        size: size || { width: 800, height: 600 }
      }
    });
    return response.data;
  }

  async createContentFromTemplate(templateName: string, variables: Record<string, string>): Promise<ApiResponse<ContentCreationResponse>> {
    const response = await this.api.post('/mcp/call', {
      name: 'content_creation',
      arguments: {
        operation: 'create_from_template',
        template_name: templateName,
        variables
      }
    });
    return response.data;
  }

  async generateBulkContent(baseContent: string, variations: number = 5, contentType: string = 'social_post'): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'content_creation',
      arguments: {
        operation: 'generate_bulk_content',
        base_content: baseContent,
        variations,
        content_type: contentType
      }
    });
    return response.data;
  }

  async optimizeContentForSEO(content: string, keywords?: string[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'content_creation',
      arguments: {
        operation: 'optimize_for_seo',
        content,
        keywords: keywords || []
      }
    });
    return response.data;
  }

  async generateContentCalendar(startDate: string, endDate: string, contentTypes?: string[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name: 'content_creation',
      arguments: {
        operation: 'generate_calendar',
        start_date: startDate,
        end_date: endDate,
        content_types: contentTypes || []
      }
    });
    return response.data;
  }

  // Enhanced Workflow endpoints
  async createWorkflow(data: WorkflowCreateRequest): Promise<ApiResponse<Workflow>> {
    const response = await this.api.post('/workflows/create', data);
    return response.data;
  }

  async getWorkflows(): Promise<ApiResponse<Workflow[]>> {
    const response = await this.api.get('/workflows/');
    return response.data;
  }

  async getWorkflow(workflowId: number): Promise<ApiResponse<Workflow>> {
    const response = await this.api.get(`/workflows/${workflowId}`);
    return response.data;
  }

  async updateWorkflow(workflowId: number, data: any): Promise<ApiResponse<Workflow>> {
    const response = await this.api.put(`/workflows/${workflowId}`, data);
    return response.data;
  }

  async deleteWorkflow(workflowId: number): Promise<void> {
    await this.api.delete(`/workflows/${workflowId}`);
  }

  async executeWorkflow(workflowId: number, data: WorkflowExecuteRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/workflows/${workflowId}/execute`, data);
    return response.data;
  }

  async getWorkflowExecutions(workflowId: number): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(`/workflows/${workflowId}/executions`);
    return response.data;
  }

  async testWorkflowCondition(condition: any, context: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/workflows/test-condition', {
      condition,
      context
    });
    return response.data;
  }

  async testVariableSubstitution(parameters: any, context: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/workflows/test-variable-substitution', {
      parameters,
      context
    });
    return response.data;
  }

  async getWorkflowExecution(executionId: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/workflows/executions/${executionId}`);
    return response.data;
  }

  async getAllWorkflowExecutions(userId?: number): Promise<ApiResponse<any[]>> {
    const params = userId ? { user_id: userId } : {};
    const response = await this.api.get('/workflows/executions', { params });
    return response.data;
  }

  async getWorkflowStepExecutions(executionId: number): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(`/workflows/executions/${executionId}/steps`);
    return response.data;
  }

  async retryWorkflowStep(stepExecutionId: number): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/workflows/step-executions/${stepExecutionId}/retry`);
    return response.data;
  }

  async cancelWorkflowExecution(executionId: number): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/workflows/executions/${executionId}/cancel`);
    return response.data;
  }

  async getWorkflowTemplates(): Promise<ApiResponse<WorkflowTemplate[]>> {
    const response = await this.api.get('/workflows/templates');
    return response.data;
  }

  async createChatAgent(data: WorkflowCreateRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post('/workflows/chat-agent', data);
    return response.data;
  }

  // Workflow extraction from conversation endpoints
  async getConversationToolCalls(conversationId: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/workflows/conversation/${conversationId}/tool-calls`);
    return response.data;
  }

  async extractWorkflowFromConversation(data: {
    conversation_id: number;
    workflow_name: string;
    description?: string;
    selected_step_ids?: string[];
    parameterize_fields?: string[];
    trigger_type?: string;
    trigger_config?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.post('/workflows/extract-from-conversation', data);
    return response.data;
  }

  async createWorkflowFromSteps(data: {
    workflow_name: string;
    description: string;
    steps: Array<{
      step_number: number;
      tool_name: string;
      tool_parameters: Record<string, any>;
      description?: string;
      condition?: any;
      retry_config?: { max_retries: number; retry_delay: number };
      timeout?: number;
    }>;
    trigger_type?: string;
    trigger_config?: Record<string, any>;
    variables?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    console.log('[API] createWorkflowFromSteps request:', data);
    const response = await this.api.post('/workflows/create-from-steps', data);
    console.log('[API] createWorkflowFromSteps raw response:', response);
    console.log('[API] createWorkflowFromSteps response.data:', response.data);
    return response.data;
  }

  // Agent endpoints
  async createAgent(data: AgentCreate): Promise<ApiResponse<AgentResponse>> {
    const response = await this.api.post('/agents/create', data);
    return response.data;
  }

  async getAgents(): Promise<ApiResponse<AgentResponse[]>> {
    const response = await this.api.get('/agents/');
    return response.data;
  }

  async getAgentStatus(agentId: string): Promise<ApiResponse<AgentStatusResponse>> {
    const response = await this.api.get(`/agents/${agentId}/status`);
    return response.data;
  }

  async pauseAgent(agentId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/agents/${agentId}/pause`);
    return response.data;
  }

  async resumeAgent(agentId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/agents/${agentId}/resume`);
    return response.data;
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.api.delete(`/agents/${agentId}`);
  }

  async executeAgent(agentId: string, inputData?: any): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/agents/${agentId}/execute`, {
      input_data: inputData || {}
    });
    return response.data;
  }

  async getAgentAnalytics(agentId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/agents/${agentId}/analytics`);
    return response.data;
  }

  async scheduleAgent(agentId: string, scheduleConfig: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/agents/schedule', {
      agent_id: agentId,
      schedule_config: scheduleConfig
    });
    return response.data;
  }

  async getAgentTemplates(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/agents/templates');
    return response.data;
  }

  // Payment endpoints
  async initiateMpesaPayment(data: MpesaPaymentRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/mpesa/initiate', data);
    return response.data;
  }

  async verifyMpesaPayment(data: PaymentVerificationRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/mpesa/verify', data);
    return response.data;
  }

  async createStripeCustomer(data: StripeCustomerRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/stripe/create-customer', data);
    return response.data;
  }

  async createStripeSubscription(customerId: string, priceId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/stripe/create-subscription', {
      customer_id: customerId,
      price_id: priceId
    });
    return response.data;
  }

  async createStripePaymentIntent(data: StripePaymentRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/stripe/create-payment-intent', data);
    return response.data;
  }

  async getPricingPlans(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/payments/pricing');
    return response.data;
  }

  // Server status and info
  async getServerStatus(): Promise<ApiResponse<ServerStatus>> {
    const response = await this.api.get('/api/v1/status');
    return response.data;
  }

  async getServerInfo(): Promise<ApiResponse<ServerInfo>> {
    const response = await this.api.get('/');
    return response.data;
  }

  // Pricing and subscriptions
  async getPricing(): Promise<ApiResponse<PricingTiers>> {
    const response = await this.api.get('/api/v1/pricing');
    return response.data;
  }

  async createSubscription(email: string, tier: string = 'pro'): Promise<ApiResponse<{ customer_id: string; subscription_id: string; tier: string }>> {
    const response = await this.api.post('/api/v1/subscriptions', { email, tier });
    return response.data;
  }

  async createEnterpriseSetup(email: string, description: string = 'Enterprise Setup'): Promise<ApiResponse<{ payment_intent_id: string; client_secret: string; amount: number }>> {
    const response = await this.api.post('/api/v1/enterprise-setup', { email, description });
    return response.data;
  }

  // Usage tracking
  async getUsage(userId: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/api/v1/usage/${userId}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Payment history
  async getPaymentHistory(): Promise<ApiResponse<Payment[]>> {
    const response = await this.api.get('/payments/history');
    return response.data;
  }

  // Subscription management
  async getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
    const response = await this.api.get('/payments/subscriptions');
    return response.data;
  }

  // Usage logs
  async getUsageLogs(): Promise<ApiResponse<UsageLog[]>> {
    const response = await this.api.get('/api/v1/usage-logs');
    return response.data;
  }

  // Phase 2: Advanced Features
  async executeLeadScoring(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('lead_scoring_engine', { operation, ...data });
  }

  async executeCustomerJourney(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('customer_journey_mapping', { operation, ...data });
  }

  async executePredictiveAnalytics(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('predictive_analytics_engine', { operation, ...data });
  }

  async executeABTesting(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('ab_testing_platform', { operation, ...data });
  }

  async executeSocialMedia(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('social_media_management', { operation, ...data });
  }

  // Phase 3: Enterprise Features
  async executeWhiteLabel(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('white_label_management', { operation, ...data });
  }

  async executeWorkflowBuilder(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('workflow_builder', { operation, ...data });
  }

  async executeAPIManagement(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('api_management', { operation, ...data });
  }

  async executeEnterpriseSecurity(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('enterprise_security', { operation, ...data });
  }

  async executeMultiTenant(operation: string, data: any): Promise<any> {
    return this.executeMCPTool('multi_tenant_management', { operation, ...data });
  }

  // White-Label Management Methods
  async createBrand(brandConfig: any): Promise<any> {
    return this.executeWhiteLabel('create_brand', { brand_config: brandConfig });
  }

  async updateBrand(brandId: string, brandConfig: any): Promise<any> {
    return this.executeWhiteLabel('update_brand', {
      brand_id: brandId,
      brand_config: brandConfig
    });
  }

  async createDeployment(brandId: string, domainConfig: any): Promise<any> {
    return this.executeWhiteLabel('create_deployment', {
      brand_id: brandId,
      domain_config: domainConfig
    });
  }

  async getBrandAssets(brandId: string): Promise<any> {
    return this.executeWhiteLabel('get_assets', { brand_id: brandId });
  }

  async getDeploymentStatus(deploymentId: string): Promise<any> {
    return this.executeWhiteLabel('get_status', { deployment_id: deploymentId });
  }

  // Workflow Builder Methods
  async createWorkflowFromBuilder(workflowConfig: any, triggers: any[], steps: any[], conditions: any[]): Promise<any> {
    return this.executeWorkflowBuilder('create_workflow', {
      workflow_config: workflowConfig,
      triggers,
      steps,
      conditions
    });
  }



  async updateWorkflowFromBuilder(workflowId: string, updates: any): Promise<any> {
    return this.executeWorkflowBuilder('update_workflow', {
      workflow_id: workflowId,
      workflow_config: updates
    });
  }

  async executeWorkflowFromBuilder(workflowId: string, triggerData: any): Promise<any> {
    return this.executeWorkflowBuilder('execute_workflow', {
      workflow_id: workflowId,
      trigger_data: triggerData
    });
  }

  async getWorkflowAnalytics(workflowId: string, dateRange?: string): Promise<any> {
    return this.executeWorkflowBuilder('get_analytics', {
      workflow_id: workflowId,
      workflow_config: { date_range: dateRange }
    });
  }

  // API Management Methods
  async createAPIKey(userId: string, name: string, permissions: string[], rateLimit?: number): Promise<any> {
    return this.executeAPIManagement('create_api_key', {
      user_id: userId,
      rate_limit_config: { name, rate_limit: rateLimit },
      permissions
    });
  }

  async validateAPIKey(apiKey: string): Promise<any> {
    return this.executeAPIManagement('validate_key', { api_key: apiKey });
  }

  async setRateLimit(userId: string, endpoint: string, limits: any): Promise<any> {
    return this.executeAPIManagement('set_rate_limit', {
      user_id: userId,
      rate_limit_config: {
        endpoint,
        requests_per_minute: limits.per_minute,
        requests_per_hour: limits.per_hour,
        requests_per_day: limits.per_day
      }
    });
  }

  async getAPIAnalytics(userId: string, dateRange?: string): Promise<any> {
    return this.executeAPIManagement('get_analytics', {
      user_id: userId,
      rate_limit_config: { date_range: dateRange }
    });
  }

  async createDeveloperPortal(userId: string, portalConfig: any): Promise<any> {
    return this.executeAPIManagement('create_portal', {
      user_id: userId,
      portal_config: portalConfig
    });
  }

  // Enterprise Security Methods
  async createSecurityPolicy(policyConfig: any): Promise<any> {
    return this.executeEnterpriseSecurity('create_policy', { policy_config: policyConfig });
  }

  async enforceSecurityPolicy(userId: string, action: string, resource: string, context: any): Promise<any> {
    return this.executeEnterpriseSecurity('enforce_policy', {
      user_id: userId,
      action,
      resource,
      context
    });
  }

  async encryptData(keyId: string, data: string): Promise<any> {
    return this.executeEnterpriseSecurity('encrypt_data', {
      key_id: keyId,
      data
    });
  }

  async decryptData(keyId: string, encryptedData: string): Promise<any> {
    return this.executeEnterpriseSecurity('decrypt_data', {
      key_id: keyId,
      data: encryptedData
    });
  }

  async runComplianceCheck(checkType: string, parameters: any): Promise<any> {
    return this.executeEnterpriseSecurity('run_compliance_check', {
      check_type: checkType,
      parameters
    });
  }

  // Multi-Tenant Management Methods
  async createTenant(tenantConfig: any): Promise<any> {
    return this.executeMultiTenant('create_tenant', { tenant_config: tenantConfig });
  }

  async updateTenantPlan(tenantId: string, newPlan: string): Promise<any> {
    return this.executeMultiTenant('update_plan', {
      tenant_id: tenantId,
      new_plan: newPlan
    });
  }

  async checkTenantQuota(tenantId: string, resourceType: string, amount: number = 1): Promise<any> {
    return this.executeMultiTenant('check_quota', {
      tenant_id: tenantId,
      resource_type: resourceType,
      amount
    });
  }

  async getTenantAnalytics(tenantId: string, dateRange?: string): Promise<any> {
    return this.executeMultiTenant('get_analytics', {
      tenant_id: tenantId,
      tenant_config: { date_range: dateRange }
    });
  }

  async createTenantIntegration(tenantId: string, integrationType: string, config: any): Promise<any> {
    const response = await this.api.post('/mcp/call', {
      name: 'multi_tenant_management',
      arguments: {
        operation: 'create_integration',
        tenant_id: tenantId,
        integration_type: integrationType,
        config: config
      }
    });
    return response.data;
  }

  // Chat endpoints
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await this.api.get('/chat/conversations');
    return response.data;
  }

  async createConversation(data: ConversationCreate): Promise<ApiResponse<Conversation>> {
    const response = await this.api.post('/chat/conversations', data);
    return response.data;
  }

  async getMessages(conversationId: number): Promise<ApiResponse<Message[]>> {
    const response = await this.api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId: number, data: MessageCreate): Promise<Message> {
    const response = await this.api.post(`/chat/conversations/${conversationId}/messages`, data);
    // Backend returns MessageRead object directly, not wrapped in ApiResponse
    return response.data;
  }

  async updateConversation(conversationId: number, title: string): Promise<ApiResponse<Conversation>> {
    const response = await this.api.put(`/chat/conversations/${conversationId}`, { title });
    return response.data;
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.api.delete(`/chat/conversations/${conversationId}`);
  }

  async getLLMProviders(): Promise<ApiResponse<LLMProviderResponse>> {
    const response = await this.api.get('/chat/providers');
    return response.data;
  }

  async getAvailableTools(): Promise<ApiResponse<ChatToolsResponse>> {
    const response = await this.api.get('/chat/tools');
    return response.data;
  }

  // Settings endpoints
  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    const response = await this.api.get('/settings');
    return response.data;
  }

  async updateUserSettings(settings: UserSettingsUpdate): Promise<ApiResponse<UserSettings>> {
    const response = await this.api.put('/settings', settings);
    return response.data;
  }

  async resetUserSettings(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.delete('/settings');
    return response.data;
  }

  // Notification settings
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    const response = await this.api.get('/settings/notifications');
    return response.data;
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<ApiResponse<NotificationSettings>> {
    const response = await this.api.put('/settings/notifications', settings);
    return response.data;
  }

  // API settings
  async getAPISettings(): Promise<ApiResponse<APISettings>> {
    const response = await this.api.get('/settings/api');
    return response.data;
  }

  async updateAPISettings(settings: APISettings): Promise<ApiResponse<APISettings>> {
    const response = await this.api.put('/settings/api', settings);
    return response.data;
  }

  // Dashboard settings
  async getDashboardSettings(): Promise<ApiResponse<DashboardSettings>> {
    const response = await this.api.get('/settings/dashboard');
    return response.data;
  }

  async updateDashboardSettings(settings: DashboardSettings): Promise<ApiResponse<DashboardSettings>> {
    const response = await this.api.put('/settings/dashboard', settings);
    return response.data;
  }

  // Integration settings
  async getIntegrationSettings(): Promise<ApiResponse<IntegrationSettings>> {
    const response = await this.api.get('/settings/integrations');
    return response.data;
  }

  async updateIntegrationSettings(settings: IntegrationSettings): Promise<ApiResponse<IntegrationSettings>> {
    const response = await this.api.put('/settings/integrations', settings);
    return response.data;
  }

  // Security settings
  async getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
    const response = await this.api.get('/settings/security');
    return response.data;
  }

  async updateSecuritySettings(settings: SecuritySettings): Promise<ApiResponse<SecuritySettings>> {
    const response = await this.api.put('/settings/security', settings);
    return response.data;
  }

  // Chat streaming endpoints

  // Tool execution streaming
  async executeToolStream(
    toolName: string,
    toolArguments: Record<string, any>,
    onStatus: (status: string) => void,
    onError: (error: string) => void,
    onComplete: (result: any) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.api.defaults.baseURL}/mcp/call/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: toolName,
          arguments: toolArguments,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'status':
                  onStatus(data.message);
                  break;
                case 'error':
                  onError(data.error);
                  break;
                case 'complete':
                  onComplete(data.result);
                  break;
                case 'start':
                  onStatus(data.message);
                  break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Tool streaming error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Power BI endpoints
  async testPowerBIConnection(config?: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/powerbi/test-connection', config);
    return response.data;
  }

  async getPowerBIWorkspaces(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/powerbi/workspaces');
    return response.data;
  }

  async getPowerBIDatasets(workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get('/powerbi/datasets', { params });
    return response.data;
  }

  async getPowerBIReports(workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get('/powerbi/reports', { params });
    return response.data;
  }

  async getPowerBIDashboards(workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get('/powerbi/dashboards', { params });
    return response.data;
  }

  async getDatasetSchema(datasetId: string, workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get(`/powerbi/datasets/${datasetId}/schema`, { params });
    return response.data;
  }

  async executeDAXQuery(datasetId: string, query: string, workspaceId?: string): Promise<ApiResponse<any>> {
    const data = {
      dataset_id: datasetId,
      query,
      workspace_id: workspaceId
    };
    const response = await this.api.post('/powerbi/execute-query', data);
    return response.data;
  }

  async refreshDataset(datasetId: string, workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.post(`/powerbi/datasets/${datasetId}/refresh`, {}, { params });
    return response.data;
  }

  async getRefreshHistory(datasetId: string, workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get(`/powerbi/datasets/${datasetId}/refresh-history`, { params });
    return response.data;
  }

  async getReportEmbedToken(reportId: string, workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.post(`/powerbi/reports/${reportId}/embed-token`, {}, { params });
    return response.data;
  }

  async getWorkspaceUsers(workspaceId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/powerbi/workspaces/${workspaceId}/users`);
    return response.data;
  }

  async getActivityLogs(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await this.api.get('/powerbi/activity-logs', { params });
    return response.data;
  }

  async createPowerBIWorkspace(name: string, description?: string): Promise<ApiResponse<any>> {
    const data = { name, description };
    const response = await this.api.post('/powerbi/workspaces', data);
    return response.data;
  }

  async deletePowerBIWorkspace(workspaceId: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/powerbi/workspaces/${workspaceId}`);
    return response.data;
  }

  async getAnalyticsSummary(workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get('/powerbi/analytics-summary', { params });
    return response.data;
  }

  // Asana endpoints
  async testAsanaConnection(config: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/test-asana', config);
    return response.data;
  }

  async asanaCreateProject(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/asana/projects', data);
    return response.data;
  }

  async asanaListProjects(workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get('/connections/asana/projects', { params });
    return response.data;
  }

  async asanaCreateTask(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/asana/tasks', data);
    return response.data;
  }

  async asanaListTasks(projectId?: string): Promise<ApiResponse<any>> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await this.api.get('/connections/asana/tasks', { params });
    return response.data;
  }

  async asanaAddComment(taskId: string, comment: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/connections/asana/tasks/${taskId}/comments`, { comment });
    return response.data;
  }

  async asanaGetTeams(workspaceId?: string): Promise<ApiResponse<any>> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.api.get('/connections/asana/teams', { params });
    return response.data;
  }

  async asanaGetWorkspaces(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/connections/asana/workspaces');
    return response.data;
  }

  // Zoom endpoints
  async testZoomConnection(config: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/test-zoom', config);
    return response.data;
  }

  async zoomCreateMeeting(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/zoom/meetings', data);
    return response.data;
  }

  async zoomGetMeeting(meetingId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/zoom/meetings/${meetingId}`);
    return response.data;
  }

  async zoomUpdateMeeting(meetingId: string, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/connections/zoom/meetings/${meetingId}`, data);
    return response.data;
  }

  async zoomDeleteMeeting(meetingId: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/connections/zoom/meetings/${meetingId}`);
    return response.data;
  }

  async zoomListMeetings(userId?: string): Promise<ApiResponse<any>> {
    const params = userId ? { user_id: userId } : {};
    const response = await this.api.get('/connections/zoom/meetings', { params });
    return response.data;
  }

  async zoomGetMeetingParticipants(meetingId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/zoom/meetings/${meetingId}/participants`);
    return response.data;
  }

  async zoomGetMeetingRegistrants(meetingId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/zoom/meetings/${meetingId}/registrants`);
    return response.data;
  }

  async zoomGetMeetingInvitation(meetingId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/zoom/meetings/${meetingId}/invitation`);
    return response.data;
  }

  async zoomUpdateMeetingStatus(meetingId: string, statusAction: string): Promise<ApiResponse<any>> {
    const response = await this.api.patch(`/connections/zoom/meetings/${meetingId}/status`, { status_action: statusAction });
    return response.data;
  }

  async zoomGetMeetingRecordings(meetingId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/zoom/meetings/${meetingId}/recordings`);
    return response.data;
  }


  async createStripeSubscriptionCheckoutSession(planId: string, amount: number, currency: string = 'kes'): Promise<ApiResponse<{ checkout_url: string; session_id: string }>> {
    const response = await this.api.post('/payments/stripe/create-subscription-checkout-session', { plan_id: planId, amount, currency });
    return response.data;
  }

  async zoomDeleteRecording(meetingId: string, recordingId: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/connections/zoom/meetings/${meetingId}/recordings/${recordingId}`);
    return response.data;
  }

  async zoomGetUser(userId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/zoom/users/${userId}`);
    return response.data;
  }

  async zoomListUsers(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/connections/zoom/users');
    return response.data;
  }

  async zoomCreateWebinar(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/zoom/webinars', data);
    return response.data;
  }

  async zoomGetWebinar(webinarId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/zoom/webinars/${webinarId}`);
    return response.data;
  }

  async zoomListWebinars(userId?: string): Promise<ApiResponse<any>> {
    const params = userId ? { user_id: userId } : {};
    const response = await this.api.get('/connections/zoom/webinars', { params });
    return response.data;
  }

  async zoomGetMeetingReports(dateRange?: string): Promise<ApiResponse<any>> {
    const params = dateRange ? { date_range: dateRange } : {};
    const response = await this.api.get('/connections/zoom/reports/meetings', { params });
    return response.data;
  }

  async zoomGetDailyReports(date?: string): Promise<ApiResponse<any>> {
    const params = date ? { date } : {};
    const response = await this.api.get('/connections/zoom/reports/daily', { params });
    return response.data;
  }

  // Teams endpoints
  async testTeamsConnection(config: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/test-teams', config);
    return response.data;
  }

  async teamsSendMessage(channelId: string, message: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/connections/teams/channels/${channelId}/messages`, { message });
    return response.data;
  }

  async teamsSendAdaptiveCard(channelId: string, cardData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/connections/teams/channels/${channelId}/adaptive-cards`, cardData);
    return response.data;
  }

  async teamsSendAlert(channelId: string, alertData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/connections/teams/channels/${channelId}/alerts`, alertData);
    return response.data;
  }

  async teamsSendMeetingNotification(channelId: string, meetingData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/connections/teams/channels/${channelId}/meeting-notifications`, meetingData);
    return response.data;
  }

  async teamsListChannels(teamId?: string): Promise<ApiResponse<any>> {
    const params = teamId ? { team_id: teamId } : {};
    const response = await this.api.get('/connections/teams/channels', { params });
    return response.data;
  }

  async teamsGetChannelMembers(channelId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/teams/channels/${channelId}/members`);
    return response.data;
  }

  async teamsCreateChannel(teamId: string, channelData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/connections/teams/teams/${teamId}/channels`, channelData);
    return response.data;
  }

  async teamsGetTeamInfo(teamId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/connections/teams/teams/${teamId}`);
    return response.data;
  }

  async teamsSearchMessages(query: string, channelId?: string): Promise<ApiResponse<any>> {
    const params: any = { query };
    if (channelId) params.channel_id = channelId;
    const response = await this.api.get('/connections/teams/messages/search', { params });
    return response.data;
  }

  // Salesforce endpoints
  async testSalesforceConnection(config: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/test-salesforce', config);
    return response.data;
  }

  async salesforceCreateContact(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/salesforce/contacts', data);
    return response.data;
  }

  async salesforceSearchContacts(query: string, limit?: number): Promise<ApiResponse<any>> {
    const params: any = { query };
    if (limit) params.limit = limit;
    const response = await this.api.get('/connections/salesforce/contacts/search', { params });
    return response.data;
  }

  async salesforceCreateLead(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/salesforce/leads', data);
    return response.data;
  }

  async salesforceGetLeads(status?: string, limit?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (status) params.status = status;
    if (limit) params.limit = limit;
    const response = await this.api.get('/connections/salesforce/leads', { params });
    return response.data;
  }

  async salesforceCreateOpportunity(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/salesforce/opportunities', data);
    return response.data;
  }

  async salesforceGetOpportunities(stage?: string, limit?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (stage) params.stage = stage;
    if (limit) params.limit = limit;
    const response = await this.api.get('/connections/salesforce/opportunities', { params });
    return response.data;
  }

  async salesforceGetSalesPipelineReport(dateRange?: string): Promise<ApiResponse<any>> {
    const params = dateRange ? { date_range: dateRange } : {};
    const response = await this.api.get('/connections/salesforce/reports/pipeline', { params });
    return response.data;
  }

  async salesforceSyncContactsFromHubSpot(hubspotContacts: any[]): Promise<ApiResponse<any>> {
    const response = await this.api.post('/connections/salesforce/contacts/sync-hubspot', { hubspot_contacts: hubspotContacts });
    return response.data;
  }

  // ==================== Marketplace API ====================

  async browseMarketplace(params?: {
    category?: string;
    search?: string;
    sort_by?: 'downloads' | 'rating' | 'newest';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.get('/marketplace/browse', { params });
    return response.data;
  }

  async getMarketplaceCategories(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/marketplace/categories');
    return response.data;
  }

  async getWorkflowByShareCode(shareCode: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/marketplace/workflow/${shareCode}`);
    return response.data;
  }

  async exportWorkflow(workflowId: number): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/marketplace/workflow/${workflowId}/export`);
    return response.data;
  }

  async importWorkflow(data: { workflow_data: any; source_workflow_id?: number }): Promise<ApiResponse<any>> {
    const response = await this.api.post('/marketplace/workflow/import', data);
    return response.data;
  }

  async updateWorkflowVisibility(workflowId: number, data: {
    visibility: string;
    license_type?: string;
    price?: number;
    currency?: string;
    category?: string;
    tags?: string[];
    author_name?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/marketplace/workflow/${workflowId}/visibility`, data);
    return response.data;
  }

  async getWorkflowReviews(workflowId: number, limit?: number, offset?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.api.get(`/marketplace/workflow/${workflowId}/reviews`, { params });
    return response.data;
  }

  async addWorkflowReview(workflowId: number, data: { rating: number; title?: string; comment?: string }): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/marketplace/workflow/${workflowId}/review`, data);
    return response.data;
  }

  async getMySharedWorkflows(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/marketplace/my-shared');
    return response.data;
  }

  async getMyDownloads(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/marketplace/my-downloads');
    return response.data;
  }

  // ================== Creator Profile API ==================

  async getMyCreatorProfile(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/creators/me');
    return response.data;
  }

  async createOrUpdateCreatorProfile(data: {
    display_name: string;
    bio?: string;
    avatar_url?: string;
    website?: string;
    github_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    is_public?: boolean;
    accept_donations?: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.post('/creators/me', data);
    return response.data;
  }

  async getCreatorProfile(creatorId: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/creators/${creatorId}`);
    return response.data;
  }

  async getCreatorWorkflows(creatorId: number, limit?: number, offset?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.api.get(`/creators/${creatorId}/workflows`, { params });
    return response.data;
  }

  async getTopCreators(limit?: number, sortBy?: 'downloads' | 'rating' | 'workflows'): Promise<ApiResponse<any>> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (sortBy) params.sort_by = sortBy;
    const response = await this.api.get('/creators/top', { params });
    return response.data;
  }

  async refreshCreatorStats(): Promise<ApiResponse<any>> {
    const response = await this.api.post('/creators/me/refresh-stats');
    return response.data;
  }

  // ================== Follower API ==================

  async followCreator(creatorId: number): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/creators/${creatorId}/follow`);
    return response.data;
  }

  async unfollowCreator(creatorId: number): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/creators/${creatorId}/follow`);
    return response.data;
  }

  async checkFollowing(creatorId: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/creators/${creatorId}/is-following`);
    return response.data;
  }

  async getMyFollowers(limit?: number, offset?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.api.get('/creators/me/followers', { params });
    return response.data;
  }

  async getMyFollowing(limit?: number, offset?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.api.get('/creators/me/following', { params });
    return response.data;
  }

  async getActivityFeed(limit?: number, offset?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.api.get('/creators/me/activity-feed', { params });
    return response.data;
  }

  // ================== Analytics API ==================

  async trackAnalyticsEvent(workflowId: number, eventType: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/analytics/track', {
      workflow_id: workflowId,
      event_type: eventType,
    });
    return response.data;
  }

  async getMarketplaceWorkflowAnalytics(workflowId: number, days?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (days) params.days = days;
    const response = await this.api.get(`/analytics/workflow/${workflowId}`, { params });
    return response.data;
  }

  async getMyWorkflowsAnalytics(days?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (days) params.days = days;
    const response = await this.api.get('/analytics/my-workflows', { params });
    return response.data;
  }

  async getTrendingWorkflows(days?: number, limit?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (days) params.days = days;
    if (limit) params.limit = limit;
    const response = await this.api.get('/analytics/trending', { params });
    return response.data;
  }

  // ================== Notifications API ==================

  async getNotifications(unreadOnly?: boolean, limit?: number, offset?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (unreadOnly !== undefined) params.unread_only = unreadOnly;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.api.get('/notifications', { params });
    return response.data;
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    const response = await this.api.put('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: number): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // ================== Templates API ==================

  async getTemplates(params?: {
    category?: string;
    difficulty?: string;
    search?: string;
    connection?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.get('/templates/', { params });
    return response.data;
  }

  async getTemplateCategories(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/templates/categories/');
    return response.data;
  }

  async getTemplate(templateId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/templates/${templateId}`);
    return response.data;
  }

  async useTemplate(templateId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/templates/${templateId}/use`);
    return response.data;
  }

  async getFeaturedTemplates(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/templates/featured/list');
    return response.data;
  }

  async getPopularTemplates(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/templates/stats/popular');
    return response.data;
  }

  // ================== Payment/Purchase API ==================

  async purchaseWorkflow(workflowId: number, paymentMethod: string, phoneNumber?: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/workflow/purchase', {
      workflow_id: workflowId,
      payment_method: paymentMethod,
      phone_number: phoneNumber,
    });
    return response.data;
  }

  async getMyPurchases(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/payments/my-purchases');
    return response.data;
  }

  async getCreatorEarnings(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/payments/creator/earnings');
    return response.data;
  }

  // ================== Favorites API ==================

  async getMyFavorites(limit?: number, offset?: number): Promise<ApiResponse<any>> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.api.get('/favorites', { params });
    return response.data;
  }

  async addToFavorites(workflowId: number): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/favorites/${workflowId}`);
    return response.data;
  }

  async removeFromFavorites(workflowId: number): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/favorites/${workflowId}`);
    return response.data;
  }

  async checkFavorite(workflowId: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/favorites/${workflowId}/check`);
    return response.data;
  }

  // ================== Preferences API ==================

  async getPreferences(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/preferences');
    return response.data;
  }

  async updatePreferences(preferences: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.put('/preferences', preferences);
    return response.data;
  }

  async updateEmailNotificationPreferences(settings: {
    email_on_download?: boolean;
    email_on_sale?: boolean;
    email_on_review?: boolean;
    email_on_follower?: boolean;
    email_weekly_summary?: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.put('/preferences/notifications/email', null, { params: settings });
    return response.data;
  }

  async updateInAppNotificationPreferences(settings: {
    notify_on_download?: boolean;
    notify_on_sale?: boolean;
    notify_on_review?: boolean;
    notify_on_follower?: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.put('/preferences/notifications/in-app', null, { params: settings });
    return response.data;
  }

  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<ApiResponse<any>> {
    const response = await this.api.put('/preferences/theme', null, { params: { theme } });
    return response.data;
  }

  // M-Pesa Agent endpoints
  async getMpesaAgentConfig(): Promise<ApiResponse<MpesaAgentConfig>> {
    const response = await this.api.get('/api/agents/mpesa/config');
    return response.data;
  }

  async updateMpesaAgentConfig(config: Partial<MpesaAgentConfig>): Promise<ApiResponse<MpesaAgentConfig>> {
    const response = await this.api.post('/api/agents/mpesa/config', config);
    return response.data;
  }

  async getMpesaPaymentSummary(days: number = 1): Promise<ApiResponse<MpesaPaymentSummary>> {
    const response = await this.api.get('/api/agents/mpesa/summary', { params: { days } });
    return response.data;
  }

  async getMpesaPayments(params: {
    limit?: number;
    offset?: number;
    status?: 'pending' | 'matched' | 'unmatched';
  } = {}): Promise<ApiResponse<MpesaPaymentListResponse>> {
    const response = await this.api.get('/api/agents/mpesa/payments', { params });
    return response.data;
  }

  async getUnmatchedMpesaPayments(limit: number = 10): Promise<ApiResponse<{ payments: MpesaPayment[] }>> {
    const response = await this.api.get('/api/agents/mpesa/payments/unmatched', { params: { limit } });
    return response.data;
  }

  // ========================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================

  async cancelSubscription(reason?: string, feedback?: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/subscriptions/cancel', {
      reason,
      feedback
    });
    return response.data;
  }

  async reactivateSubscription(): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/subscriptions/reactivate');
    return response.data;
  }

  // Generic MCP Tool Execution
  async executeTool(name: string, args: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/mcp/call', {
      name,
      arguments: args
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;