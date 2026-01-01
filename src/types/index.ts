export interface User {
  id: number;
  email: string;
  name: string;
  subscription_tier: 'free' | 'testing' | 'pro' | 'enterprise';
  api_key?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

// Chat Types
export interface Conversation {
  id: number;
  user_id: number;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  tokens_used?: number;
  tools_called?: Array<ToolCall>;
  tool_call_id?: string;
  error_message?: string;
  created_at: string;
}

// Tool Call Types for Workflow Extraction
export interface ToolCall {
  id?: string;
  name: string;
  arguments: Record<string, any>;
  result?: Record<string, any>;
  success?: boolean;
}

export interface ExtractedToolCall {
  id: string;
  message_id: number;
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  success: boolean;
  timestamp: string | null;
}

export interface ConversationToolCallsResponse {
  conversation_id: number;
  conversation_title: string;
  tool_calls: ExtractedToolCall[];
  total_tool_calls: number;
  successful_tool_calls: number;
  available_fields: string[];
  can_create_workflow: boolean;
}

export interface WorkflowExtractionRequest {
  conversation_id: number;
  workflow_name: string;
  description?: string;
  selected_step_ids?: string[];
  parameterize_fields?: string[];
  trigger_type?: 'manual' | 'scheduled' | 'webhook' | 'event';
  trigger_config?: Record<string, any>;
}

export interface ExtractedWorkflowStep {
  step_number: number;
  tool_name: string;
  tool_parameters: Record<string, any>;
  description: string;
  original_arguments: Record<string, any>;
  original_result: Record<string, any>;
  condition: WorkflowCondition | null;
  retry_config: { max_retries: number; retry_delay: number };
  timeout: number;
}

export interface ExtractedWorkflow {
  name: string;
  description: string;
  steps: ExtractedWorkflowStep[];
  trigger_type: string;
  trigger_config?: Record<string, any>;
  input_schema: Record<string, any>;
  source_conversation_id: number;
}

export interface WorkflowExtractionResponse {
  workflow: ExtractedWorkflow;
  extraction_summary: {
    total_messages: number;
    tool_calls_found: number;
    parameterized_fields: string[];
  };
  suggestions: string[];
}

export interface CreateWorkflowFromStepsRequest {
  workflow_name: string;
  description: string;
  steps: Array<{
    step_number: number;
    tool_name: string;
    tool_parameters: Record<string, any>;
    description?: string;
    condition?: WorkflowCondition | null;
    retry_config?: { max_retries: number; retry_delay: number };
    timeout?: number;
  }>;
  trigger_type?: string;
  trigger_config?: Record<string, any>;
  variables?: Record<string, any>;
}

export interface MessageCreate {
  content: string;
  provider?: string;
}

export interface ConversationCreate {
  title?: string;
}

export interface LLMProvider {
  name: string;
  display_name: string;
  cost_per_1k_tokens?: string;
  tool_calling_support: boolean;
  status: 'available' | 'unavailable';
}

export interface LLMProviderResponse {
  providers: string[];
  all_providers?: Array<{
    id: string;
    name: string;
    available: boolean;
  }>;
  default: string;
}

// Enhanced Tool Types for Dynamic Registry
export interface ToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  category?: string;
  always_available?: boolean;
  platform?: string;
  connection_id?: number;
  status?: 'available' | 'unavailable';
}

export interface ChatToolsResponse {
  tools: ToolInfo[];
  descriptions: string;
  total: number;
}

// Platform and Connection Types
export interface PlatformCapability {
  name: string;
  description: string;
  tool_name: string;
  inputSchema: Record<string, any>;
  operations: string[];
}

export interface ConnectionPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  capabilities: PlatformCapability[];
  config_schema: Record<string, any>;
}

export interface Connection {
  id: number;
  user_id: number;
  platform: 'hubspot' | 'ga4' | 'slack' | 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'powerbi' | 'asana' | 'zoom' | 'teams' | 'salesforce' | 'mcp_remote' | string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: Record<string, any>;
  last_sync?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionCreate {
  platform: string;
  name: string;
  config: Record<string, any>;
}

export interface ConnectionUpdate {
  name?: string;
  config?: Record<string, any>;
  status?: string;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  platform: string;
  status: 'available' | 'unavailable';
  inputSchema: Record<string, any>;
  category?: string;
  always_available?: boolean;
  connection_id?: number;
}

// Enhanced Workflow Types
export type WorkflowVisibility = 'private' | 'unlisted' | 'public' | 'marketplace';
export type WorkflowLicense = 'free' | 'personal' | 'commercial' | 'enterprise';

export interface Workflow {
  id: number;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: number;
  is_template: boolean;
  trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook';
  trigger_config?: Record<string, any>;
  variables?: Record<string, any>;
  workflow_metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  steps: WorkflowStep[];
  executions?: WorkflowExecution[];
  // Sharing & Marketplace fields
  visibility?: WorkflowVisibility;
  share_code?: string;
  license_type?: WorkflowLicense;
  price?: number;
  currency?: string;
  category?: string;
  tags?: string[];
  required_connections?: string[];
  downloads_count?: number;
  rating?: number;
  rating_count?: number;
  author_name?: string;
}

export interface WorkflowStep {
  id: number;
  step_number: number;
  tool_name: string;
  tool_parameters?: Record<string, any>;
  description?: string;
  condition?: WorkflowCondition;
  retry_config?: {
    max_retries: number;
    retry_delay: number;
  };
  timeout?: number;
  created_at: string;
  updated_at?: string;
}

export interface WorkflowCondition {
  type: 'if';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
}

export interface WorkflowExecution {
  id: number;
  workflow_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook';
  trigger_data?: Record<string, any>;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  step_executions?: WorkflowStepExecution[];
}

export interface WorkflowStepExecution {
  id: number;
  workflow_execution_id: number;
  step_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  retry_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface WorkflowCreateRequest {
  description: string;
  name?: string;
}

export interface WorkflowExecuteRequest {
  workflow_id: number;
  input_data?: Record<string, any>;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  steps: WorkflowTemplateStep[];
}

export interface WorkflowTemplateStep {
  step_number: number;
  tool_name: string;
  parameters: Record<string, any>;
  description: string;
  condition?: WorkflowCondition;
  retry_config?: {
    max_retries: number;
    retry_delay: number;
  };
  timeout?: number;
}

export interface WorkflowExecutionResponse {
  id: number;
  workflow_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ConditionTestRequest {
  condition: WorkflowCondition;
  context: Record<string, any>;
}

export interface ConditionTestResponse {
  result: boolean;
  evaluated_value: any;
  expected_value: any;
  operator: string;
}

export interface VariableSubstitutionRequest {
  parameters: Record<string, any>;
  context: Record<string, any>;
}

export interface VariableSubstitutionResponse {
  original_parameters: Record<string, any>;
  substituted_parameters: Record<string, any>;
  substitutions_made: string[];
}

// Agent Types
export interface AgentResponse {
  agent_id: string;
  workflow_id: number;
  workflow_name: string;
  status: string;
  trigger_type: string;
  schedule?: Record<string, any>;
  monitoring: Record<string, any>;
  performance_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentStatusResponse {
  agent_id: string;
  workflow_id: number;
  workflow_name: string;
  status: string;
  trigger_type: string;
  schedule?: Record<string, any>;
  monitoring: Record<string, any>;
  performance_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  workflow_id: number;
  agent_config?: Record<string, any>;
}

export interface AgentSchedule {
  agent_id: string;
  schedule_config: Record<string, any>;
}

// Settings Types
export interface NotificationSettings {
  email_notifications: boolean;
  slack_notifications: boolean;
  webhook_notifications: boolean;
  notification_webhook_url?: string;
}

export interface APISettings {
  api_rate_limit: number;
  api_timeout: number;
  auto_refresh_tokens: boolean;
}

export interface DashboardSettings {
  dashboard_theme: 'light' | 'dark' | 'auto';
  dashboard_layout: 'default' | 'compact' | 'detailed';
  show_analytics: boolean;
  show_usage_stats: boolean;
}

export interface IntegrationSettings {
  auto_sync_connections: boolean;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  backup_connections: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  ip_whitelist?: string[];
}

export interface UserSettings {
  id: number;
  user_id: number;
  notification_settings: NotificationSettings;
  api_settings: APISettings;
  dashboard_settings: DashboardSettings;
  integration_settings: IntegrationSettings;
  security_settings: SecuritySettings;
  custom_settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdate {
  notification_settings?: NotificationSettings;
  api_settings?: APISettings;
  dashboard_settings?: DashboardSettings;
  integration_settings?: IntegrationSettings;
  security_settings?: SecuritySettings;
  custom_settings?: Record<string, any>;
}

// File Management Types
export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploaded_at: string;
  user_id: number;
}

export interface PDFGenerationRequest {
  content: string;
  template?: string;
  filename?: string;
}

export interface PDFGenerationResponse {
  success: boolean;
  pdf_url?: string;
  filename?: string;
  error?: string;
}

// Web Tools Types
export interface WebScrapingRequest {
  url: string;
  selectors?: Record<string, string>;
  use_selenium?: boolean;
}

export interface WebScrapingResponse {
  success: boolean;
  data?: {
    title?: string;
    content?: string;
    meta_tags?: Record<string, string>;
    links?: Array<{ url: string; text: string }>;
    images?: Array<{ src: string; alt: string }>;
    forms?: Array<Record<string, any>>;
    tables?: Array<Record<string, any>>;
    headings?: Array<{ level: number; text: string }>;
    buttons?: Array<{ text: string; type: string }>;
    scripts?: Array<{ src: string; type: string }>;
    styles?: Array<{ href: string; type: string }>;
  };
  error?: string;
}

export interface ShortLinkRequest {
  original_url: string;
  custom_alias?: string;
}

export interface ShortLinkResponse {
  success: boolean;
  short_url?: string;
  original_url?: string;
  error?: string;
}

// Content Creation Types
export interface ImageGenerationRequest {
  text: string;
  style?: string;
  size?: { width: number; height: number };
}

export interface ImageGenerationResponse {
  success: boolean;
  image_url?: string;
  error?: string;
}

export interface ContentTemplate {
  name: string;
  description: string;
  variables: string[];
  content: string;
}

export interface ContentCreationRequest {
  template_name: string;
  variables: Record<string, string>;
}

export interface ContentCreationResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// Phase 2: Advanced Features
export interface LeadScoringRule {
  id: string;
  name: string;
  criteria: Record<string, any>;
  weights: Record<string, number>;
  threshold: number;
  active: boolean;
}

export interface LeadScore {
  lead_id: string;
  score: number;
  qualification: 'hot' | 'warm' | 'lukewarm' | 'cold';
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    actions: string[];
  }>;
}

export interface CustomerJourney {
  id: string;
  name: string;
  stages: JourneyStage[];
  touchpoints: Touchpoint[];
  active: boolean;
}

export interface JourneyStage {
  id: string;
  name: string;
  order: number;
  criteria: Record<string, any>;
}

export interface Touchpoint {
  id: string;
  type: string;
  channel: string;
  interaction_data: Record<string, any>;
}

export interface PredictiveForecast {
  metric: string;
  forecast_data: number[];
  confidence_intervals: number[][];
  accuracy_score: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: TestVariant[];
  traffic_split: Record<string, number>;
  success_metrics: string[];
  status: 'draft' | 'running' | 'completed' | 'stopped';
}

export interface TestVariant {
  id: string;
  name: string;
  config: Record<string, any>;
  performance: TestPerformance;
}

export interface TestPerformance {
  conversions: number;
  conversion_rate: number;
  revenue: number;
  statistical_significance: number;
}

export interface SocialMediaCampaign {
  id: string;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  name: string;
  type: string;
  target_audience: Record<string, any>;
  content: CampaignContent;
  schedule: CampaignSchedule;
  performance: CampaignPerformance;
}

export interface CampaignContent {
  text: string;
  media_urls: string[];
  hashtags: string[];
}

export interface CampaignSchedule {
  start_date: string;
  end_date: string;
  frequency: string;
  time_slots: string[];
}

export interface CampaignPerformance {
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  roi: number;
}

// Phase 3: Enterprise Features
export interface WhiteLabelBrand {
  id: string;
  name: string;
  config: BrandConfig;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface BrandConfig {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  company_name: string;
  domain?: string;
  favicon_url?: string;
  custom_css?: string;
  email_template?: string;
  dashboard_title: string;
  footer_text?: string;
  contact_email?: string;
  support_url?: string;
}

export interface WhiteLabelDeployment {
  id: string;
  brand_id: string;
  domain: string;
  brand_name: string;
  config: BrandConfig;
  status: 'deploying' | 'deployed' | 'failed';
  deployment_url: string;
  created_at: string;
  deployed_at?: string;
}

export interface WorkflowBuilder {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowBuilderStep[];
  conditions: WorkflowBuilderCondition[];
  status: 'draft' | 'active' | 'paused';
  execution_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

export interface WorkflowTrigger {
  id: string;
  type: string;
  config: Record<string, any>;
}

export interface WorkflowBuilderStep {
  id: string;
  name: string;
  type: 'hubspot_operation' | 'slack_operation' | 'email_operation' | 'data_transformation' | 'conditional_branch';
  config: Record<string, any>;
  order: number;
}

export interface WorkflowBuilderCondition {
  id: string;
  type: string;
  config: Record<string, any>;
}



export interface APIKey {
  id: string;
  api_key: string;
  user_id: string;
  name: string;
  permissions: string[];
  rate_limit: number;
  status: 'active' | 'inactive';
  created_at: string;
  last_used?: string;
  usage_count: number;
}

export interface RateLimit {
  id: string;
  user_id: string;
  endpoint: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  usage: RateLimitUsage;
}

export interface RateLimitUsage {
  minute: number;
  hour: number;
  day: number;
  last_reset: string;
}

export interface DeveloperPortal {
  id: string;
  user_id: string;
  config: PortalConfig;
  endpoints: PortalEndpoint[];
  examples: PortalExample[];
  status: 'active' | 'inactive';
  created_at: string;
}

export interface PortalConfig {
  title: string;
  description: string;
  theme: string;
  custom_css?: string;
  logo_url?: string;
  contact_email?: string;
  support_url?: string;
}

export interface PortalEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: PortalParameter[];
  responses: Record<string, any>;
  examples: PortalExample[];
}

export interface PortalParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default_value?: any;
}

export interface PortalExample {
  id: string;
  title: string;
  description: string;
  request: Record<string, any>;
  response: Record<string, any>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  type: string;
  rules: SecurityRule[];
  enforcement_level: 'strict' | 'warning';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface SecurityRule {
  id: string;
  type: 'ip_whitelist' | 'time_restriction' | 'resource_access' | 'action_restriction' | 'rate_limit';
  config: Record<string, any>;
}

export interface EncryptionKey {
  id: string;
  name: string;
  type: 'aes-256' | 'rsa-2048';
  key_hash: string;
  created_at: string;
  rotation_period?: number;
  status: 'active' | 'inactive';
}

export interface ComplianceCheck {
  id: string;
  type: 'gdpr_compliance' | 'sox_compliance' | 'hipaa_compliance';
  parameters: Record<string, any>;
  result: ComplianceResult;
  timestamp: string;
}

export interface ComplianceResult {
  compliant: boolean;
  issues: string[];
  score: number;
}

export interface Tenant {
  id: string;
  name: string;
  admin_email: string;
  plan: 'basic' | 'pro' | 'enterprise';
  custom_domain?: string;
  status: 'active' | 'inactive';
  created_at: string;
  subscription_end?: string;
  features: string[];
}

export interface TenantResources {
  tenant_id: string;
  quotas: TenantQuotas;
  usage: TenantUsage;
  limits: TenantQuotas;
  created_at: string;
}

export interface TenantQuotas {
  api_calls_per_day: number;
  storage_mb: number;
  users: number;
  integrations: number;
  workflows: number;
}

export interface TenantUsage {
  api_calls: number;
  storage_mb: number;
  users: number;
  integrations: number;
  workflows: number;
}

export interface TenantIntegration {
  id: string;
  tenant_id: string;
  type: string;
  config: Record<string, any>;
  status: 'active' | 'inactive';
  created_at: string;
  last_sync?: string;
}

export interface TenantConfig {
  tenant_id: string;
  settings: TenantSettings;
  integrations: Record<string, TenantIntegration>;
  custom_fields: Record<string, any>;
  workflows: Record<string, any>;
  created_at: string;
}

export interface TenantSettings {
  timezone: string;
  date_format: string;
  currency: string;
  language: string;
  notifications: NotificationSettings;
}

// Enhanced HubSpot interfaces
export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount?: number;
    dealstage: string;
    closedate?: string;
    pipeline?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface HubSpotAnalytics {
  contacts_created: number;
  deals_created: number;
  total_revenue: number;
  conversion_rate: number;
  period: {
    start_date: string;
    end_date: string;
  };
}

// Enhanced GA4 interfaces
export interface GA4TrafficData {
  summary: {
    total_sessions: number;
    total_users: number;
    total_pageviews: number;
    avg_bounce_rate: number;
  };
  by_date: Record<string, any>;
  by_source: Record<string, any>;
  period_hours: number;
}

export interface GA4UserBehavior {
  summary: {
    total_sessions: number;
    avg_session_duration: number;
    avg_pages_per_session: number;
    bounce_rate: number;
    engagement_rate: number;
  };
  by_user_type: Record<string, any>;
  by_device: Record<string, any>;
  by_date: Record<string, any>;
  period_hours: number;
  user_segments: string[];
}

export interface GA4EcommerceData {
  summary: {
    total_transactions: number;
    total_revenue: number;
    avg_order_value: number;
    items_per_purchase: number;
  };
  by_product: Record<string, any>;
  by_category: Record<string, any>;
  by_date: Record<string, any>;
  period_hours: number;
}

// Enhanced Slack interfaces
export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  member_count: number;
  topic: string;
  purpose: string;
}

export interface SlackMember {
  id: string;
  name: string;
  real_name: string;
  display_name: string;
  is_bot: boolean;
}

export interface SlackMessage {
  message_ts: string;
  channel: string;
  text: string;
  blocks?: any[];
}

// Campaign automation interfaces
export interface Campaign {
  id: string;
  type: 'email' | 'social' | 'ads' | 'multi_channel';
  target_audience: Record<string, any>;
  content: Record<string, any>;
  schedule: Record<string, any>;
  optimization_rules: Record<string, any>;
  platforms: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    roi: number;
  };
}

export interface CampaignPerformance {
  campaign_id: string;
  performance: {
    daily_stats: Record<string, any>;
    platform_stats: Record<string, any>;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_spend: number;
    overall_roi: number;
    date_range: {
      start: string;
      end: string;
    };
  };
  summary: {
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_spend: number;
    overall_roi: number;
  };
}

export interface OptimizationRecommendation {
  type: 'audience' | 'content' | 'budget' | 'timing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expected_impact: string;
}

export interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  usage: {
    api_calls: number;
    connections: number;
    storage_gb: number;
  };
  limits: {
    api_calls: number;
    connections: number;
    storage_gb: number;
  };
  next_billing_date?: string;
}

export interface Payment {
  id: number;
  user_id: number;
  payment_method: 'mpesa' | 'stripe';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  reference?: string;
  payment_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MpesaPaymentRequest {
  phone_number: string;
  amount: number;
  reference: string;
  description?: string;
}

export interface StripePaymentRequest {
  amount: number;
  currency?: string;
  customer_id?: string;
}

export interface StripeCustomerRequest {
  email: string;
  name: string;
}

export interface PaymentVerificationRequest {
  checkout_request_id: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  stripe_subscription_id?: string;
  tier: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
}

export interface UsageLog {
  id: number;
  user_id: number;
  tool_name: string;
  arguments?: string;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  result?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
export interface ServerStatus {
  status: string;
  version: string;
  services: Record<string, string>;
}

export interface ServerInfo {
  name: string;
  version: string;
  description: string;
  status: string;
  pricing_tiers: Record<string, string>;
}

export interface PricingTiers {
  tiers: Record<string, {
    price: string;
    requests_per_day: number;
    features: string[];
  }>;
}

// API Response Types
export interface WhiteLabelResponse {
  success: boolean;
  brand_id?: string;
  deployment_id?: string;
  brand?: WhiteLabelBrand;
  deployment?: WhiteLabelDeployment;
  assets?: {
    brand: WhiteLabelBrand;
    css_variables: string;
    assets: Record<string, any>;
  };
  error?: string;
}

export interface WorkflowResponse {
  success: boolean;
  workflow_id?: string;
  execution_id?: string;
  workflow?: Workflow;
  execution?: WorkflowExecution;
  result?: Record<string, any>;
  error?: string;
}

export interface APIManagementResponse {
  success: boolean;
  api_key_id?: string;
  api_key?: string;
  key_data?: APIKey;
  allowed?: boolean;
  rate_limit?: RateLimit;
  analytics?: Record<string, any>;
  portal?: DeveloperPortal;
  error?: string;
}

export interface SecurityResponse {
  success: boolean;
  policy_id?: string;
  policy?: SecurityPolicy;
  allowed?: boolean;
  violations?: SecurityViolation[];
  encrypted_data?: string;
  decrypted_data?: string;
  compliance_check?: ComplianceCheck;
  error?: string;
}

export interface SecurityViolation {
  policy_id: string;
  policy_name: string;
  violation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface MultiTenantResponse {
  success: boolean;
  tenant_id?: string;
  tenant?: Tenant;
  resources?: TenantResources;
  config?: TenantConfig;
  allowed?: boolean;
  analytics?: Record<string, any>;
  integration_id?: string;
  integration?: TenantIntegration;
  error?: string;
} 

// Power BI Types
export interface PowerBIConnectionConfig {
  client_id: string;
  client_secret: string;
  tenant_id: string;
}

export interface PowerBIWorkspace {
  id: string;
  name: string;
  description?: string;
  type: string;
  state: string;
  capacity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PowerBIDataset {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  refresh_schedule?: Record<string, any>;
  last_refresh?: string;
  created_at: string;
  updated_at: string;
}

export interface PowerBIReport {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  dataset_id: string;
  embed_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PowerBIDashboard {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  embed_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PowerBIDatasetSchema {
  dataset_id: string;
  tables: PowerBITable[];
  relationships: PowerBIRelationship[];
}

export interface PowerBITable {
  name: string;
  columns: PowerBIColumn[];
  measures?: PowerBIMeasure[];
}

export interface PowerBIColumn {
  name: string;
  data_type: string;
  format?: string;
  is_hidden?: boolean;
}

export interface PowerBIMeasure {
  name: string;
  expression: string;
  format?: string;
}

export interface PowerBIRelationship {
  name: string;
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  cross_filter_direction: string;
}

export interface PowerBIQueryRequest {
  dataset_id: string;
  query: string;
  workspace_id?: string;
}

export interface PowerBIQueryResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

export interface PowerBIRefreshHistory {
  dataset_id: string;
  refresh_history: PowerBIRefreshRecord[];
}

export interface PowerBIRefreshRecord {
  refresh_id: string;
  start_time: string;
  end_time?: string;
  status: 'completed' | 'failed' | 'in_progress';
  error_message?: string;
}

export interface PowerBIEmbedToken {
  report_id: string;
  embed_url: string;
  token: string;
  expiration: string;
}

export interface PowerBIWorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  access_right: string;
}

export interface PowerBIActivityLog {
  id: string;
  activity: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface PowerBIAnalyticsSummary {
  workspace_id?: string;
  summary: {
    total_workspaces: number;
    total_datasets: number;
    total_reports: number;
    total_dashboards: number;
    total_users: number;
    refresh_success_rate: number;
    avg_query_time: number;
  };
  recent_activity: PowerBIActivityLog[];
  top_reports: PowerBIReport[];
  refresh_status: Record<string, string>;
}

// ==================== Marketplace Types ====================

export interface MarketplaceWorkflow {
  id: number;
  name: string;
  description?: string;
  author_name: string;
  category?: string;
  tags?: string[];
  visibility: WorkflowVisibility;
  license_type: WorkflowLicense;
  price?: number;
  currency: string;
  downloads_count: number;
  rating?: number;
  rating_count: number;
  required_connections?: string[];
  steps_count: number;
  steps_preview?: Array<{ tool_name: string; description?: string }>;
  created_at: string;
}

export interface WorkflowReview {
  id: number;
  user_id: number;
  user_name?: string;
  rating: number;
  title?: string;
  comment?: string;
  helpful_count: number;
  created_at: string;
}

export interface WorkflowExportData {
  format_version: string;
  exported_at: string;
  workflow: {
    name: string;
    description?: string;
    version: number;
    trigger_type: string;
    trigger_config?: Record<string, any>;
    variables?: Record<string, any>;
    category?: string;
    tags?: string[];
    steps: Array<{
      step_number: number;
      tool_name: string;
      tool_parameters?: Record<string, any>;
      description?: string;
      condition?: any;
      retry_config?: { max_retries: number; retry_delay: number };
      timeout?: number;
    }>;
  };
  requirements: {
    connections: string[];
  };
  metadata?: {
    author: string;
    license: string;
    downloads: number;
    rating?: number;
    original_id: number;
    share_code?: string;
  };
}

export interface UpdateVisibilityRequest {
  visibility: WorkflowVisibility;
  license_type?: WorkflowLicense;
  price?: number;
  currency?: string;
  category?: string;
  tags?: string[];
  author_name?: string;
}

export interface ImportWorkflowRequest {
  workflow_data: WorkflowExportData;
  source_workflow_id?: number;
}

export interface AddReviewRequest {
  rating: number;
  title?: string;
  comment?: string;
}

export interface MarketplaceCategory {
  name: string;
  count: number;
}

export interface MarketplaceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface MySharedWorkflow {
  id: number;
  name: string;
  visibility: WorkflowVisibility;
  share_code?: string;
  downloads_count: number;
  rating?: number;
  rating_count: number;
}

export interface MyDownload {
  id: number;
  workflow_id: number;
  workflow_name: string;
  downloaded_at: string;
  imported_workflow_id?: number;
}

// Creator Profile types
export interface CreatorProfile {
  id: number;
  user_id: number;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  is_verified: boolean;
  badges?: string[];
  total_workflows: number;
  total_downloads: number;
  total_reviews: number;
  average_rating: number;
  total_earnings?: number;
  is_public: boolean;
  accept_donations: boolean;
  created_at: string;
}

export interface CreatorProfileCreate {
  display_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  is_public?: boolean;
  accept_donations?: boolean;
}

export interface CreatorWorkflow {
  id: number;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  downloads_count: number;
  rating?: number;
  rating_count: number;
  visibility: string;
  share_code?: string;
  created_at: string;
}

export interface TopCreator {
  id: number;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
  badges?: string[];
  total_workflows: number;
  total_downloads: number;
  average_rating: number;
}

// Analytics types
export interface WorkflowAnalytics {
  workflow_id: number;
  workflow_name: string;
  period_days: number;
  summary: {
    total_impressions: number;
    total_detail_views: number;
    total_imports: number;
    total_search_clicks: number;
    conversion_rate: number;
    avg_daily_views: number;
  };
  daily: DailyMetrics[];
}

export interface DailyMetrics {
  date: string;
  impressions: number;
  detail_views: number;
  imports: number;
  search_clicks: number;
}

export interface AnalyticsSummary {
  total_workflows: number;
  total_impressions: number;
  total_views: number;
  total_imports: number;
  overall_conversion_rate: number;
}

export interface WorkflowAnalyticsItem {
  workflow_id: number;
  workflow_name: string;
  impressions: number;
  detail_views: number;
  imports: number;
  conversion_rate: number;
}

export interface TrendingWorkflow {
  id: number;
  name: string;
  description?: string;
  category?: string;
  author_name?: string;
  downloads_count: number;
  rating?: number;
  rating_count: number;
  engagement_score: number;
}

// Notification types
export type NotificationType = 
  | 'workflow_imported'
  | 'workflow_reviewed'
  | 'workflow_rated'
  | 'new_follower'
  | 'milestone_reached'
  | 'system_announcement'
  | 'earnings_received';

export interface AppNotification {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  workflow_id?: number;
  workflow_name?: string;
  actor_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Follower types
export interface Follower {
  id: number;
  user_id: number;
  user_name?: string;
  followed_at: string;
}

export interface Following {
  id: number;
  user_id: number;
  user_name?: string;
  creator_profile_id?: number;
  display_name?: string;
  avatar_url?: string;
  followed_at: string;
}

export interface ActivityFeedItem {
  id: number;
  activity_type: string;
  title: string;
  description?: string;
  actor_name?: string;
  workflow_id?: number;
  workflow_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Template Gallery Types
export interface GalleryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: string;
  tags: string[];
  required_connections: string[];
  steps: Array<{
    step_number: number;
    tool_name: string;
    tool_parameters: Record<string, any>;
    description: string;
    condition?: any;
  }>;
  variables: Record<string, {
    type: string;
    required?: boolean;
    description?: string;
    default?: any;
    enum?: string[];
    format?: string;
  }>;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Purchase/Earnings Types
export interface Purchase {
  id: number;
  workflow_id: number;
  workflow_name?: string;
  workflow_description?: string;
  downloaded_at: string;
}

export interface CreatorEarnings {
  total_earnings: number;
  pending_earnings: number;
  this_month: number;
  transactions: Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
}

// Favorites Types
export interface WorkflowFavorite {
  id: number;
  workflow_id: number;
  workflow: {
    id: number;
    name: string;
    description: string;
    category: string;
    tags: string[];
    visibility: string;
    downloads_count: number;
    rating_count: number;
    author_name: string;
  } | null;
  created_at: string;
}

// User Preferences Types
export interface UserPreferences {
  email_on_download: boolean;
  email_on_sale: boolean;
  email_on_review: boolean;
  email_on_follower: boolean;
  email_weekly_summary: boolean;
  notify_on_download: boolean;
  notify_on_sale: boolean;
  notify_on_review: boolean;
  notify_on_follower: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  default_visibility: string;
}

