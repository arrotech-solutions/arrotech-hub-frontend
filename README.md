# Arrotech Hub — Frontend

> **The React-based dashboard, AI chat interface, and workflow builder powering Arrotech Hub.**

This document is the canonical technical reference for the `arrotech-hub-frontend` codebase. It follows Google's g3doc documentation philosophy: **docs-as-code**, version-controlled, and maintained alongside the source.

---

## Table of Contents

- [Platform Overview](#platform-overview)
- [Architecture](#architecture)
  - [Technology Stack](#technology-stack)
  - [Application Structure](#application-structure)
  - [Data Flow](#data-flow)
- [Core Modules](#core-modules)
  - [AI Chat Interface](#1-ai-chat-interface)
  - [Workflow Builder](#2-workflow-builder)
  - [Unified Inbox](#3-unified-inbox)
  - [Unified Task View](#4-unified-task-view)
  - [Connections Hub](#5-connections-hub)
  - [Agent Management](#6-agent-management)
- [Page Catalog](#page-catalog)
- [Component Library](#component-library)
- [API Client & State Management](#api-client--state-management)
- [Authentication & Routing](#authentication--routing)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Build & Deployment](#build--deployment)

---

## Platform Overview

The frontend is a **single-page application (SPA)** that provides:

1. **AI Chat** — Conversational interface for executing tools across 30+ integrations
2. **Visual Workflow Builder** — Drag-and-drop DAG editor (Zapier/Make-style) powered by React Flow
3. **Unified Inbox** — Aggregated messages from Gmail, Outlook, Slack, WhatsApp, Telegram, and Teams
4. **Unified Task View** — Cross-platform task aggregation from Asana, Jira, Trello, ClickUp, Notion, and Todoist
5. **Dashboard** — Real-time usage analytics, revenue tracking, and integration health
6. **Marketplace** — Agent and workflow template library
7. **Connection Manager** — OAuth-based integration management for 30+ platforms

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 18 + TypeScript | UI rendering, type safety |
| **Build Tool** | Vite 7 | Development server, HMR, production bundling |
| **Routing** | React Router v6 | Client-side navigation, protected routes |
| **Styling** | Tailwind CSS 3 + `@tailwindcss/typography` | Utility-first CSS, prose formatting |
| **State** | React Query 3 + React Context | Server cache, auth state, theme state |
| **API Client** | Axios (centralized instance) | Request/response interceptors, JWT refresh |
| **Charts** | Recharts 3 | Dashboard visualizations |
| **Workflow Editor** | `@xyflow/react` 12 (React Flow) | Visual node-based DAG builder |
| **Icons** | Lucide React | Consistent icon system |
| **Forms** | React Hook Form 7 | Form validation and state |
| **Notifications** | React Hot Toast | Toast notifications |
| **SEO** | React Helmet Async | Dynamic meta tags, title management |
| **Markdown** | React Markdown + remark-gfm | AI response rendering with GFM support |
| **Payments** | React Paystack | Paystack checkout integration |
| **PWA** | vite-plugin-pwa | Service worker, offline support |

### Application Structure

```
src/
├── components/              # Reusable UI components
│   ├── AIAssistant.tsx       # AI chat panel (34KB)
│   ├── Layout.tsx            # Authenticated app shell (sidebar, topbar)
│   ├── PublicLayout.tsx      # Marketing pages layout (header, footer)
│   ├── EnhancedWorkflowCreator.tsx  # Workflow DAG editor (93KB)
│   ├── WorkflowTemplates.tsx # Template library (46KB)
│   ├── AgentCreatorModal.tsx # WhatsApp/Telegram agent builder (28KB)
│   ├── GlobalCommandPalette.tsx  # ⌘K command palette
│   ├── SEO.tsx               # Meta tag management
│   ├── chat/                 # Chat-specific components
│   ├── calendar/             # Calendar components
│   ├── dashboard/            # Dashboard widgets
│   ├── modals/               # Shared modals
│   ├── settings/             # Settings panels
│   └── workflows/            # Workflow-specific components
│
├── pages/                   # Route-level page components
│   ├── Dashboard.tsx         # Main dashboard
│   ├── Chat.tsx              # AI chat page
│   ├── Workflows.tsx         # Workflow management (91KB)
│   ├── Connections.tsx       # Integration hub (66KB)
│   ├── Agents.tsx            # Agent management (50KB)
│   ├── UnifiedInbox.tsx      # Cross-platform inbox (107KB)
│   ├── UnifiedTaskView.tsx   # Cross-platform tasks (142KB)
│   ├── UnifiedCalendar.tsx   # Cross-platform calendar (66KB)
│   ├── WhatsAppDashboard.tsx # WhatsApp analytics (84KB)
│   ├── Marketplace.tsx       # Agent/template marketplace (56KB)
│   ├── LandingPage.tsx       # Marketing landing page (90KB)
│   ├── Login.tsx / Register.tsx  # Authentication
│   └── ...48 total page components
│
├── api.ts                   # Centralized Axios instance + interceptors
├── App.tsx                  # Root component, routing, providers
├── main.tsx                 # Entry point
└── index.css                # Global styles + Tailwind directives
```

### Data Flow

```
┌──────────────────────────────────────────────┐
│                  React App                    │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │        Context Providers                │ │
│  │  AuthContext → ThemeContext → Router     │ │
│  └──────────────────┬──────────────────────┘ │
│                     │                        │
│  ┌──────────────────▼──────────────────────┐ │
│  │           Page Components               │ │
│  │  Dashboard / Chat / Workflows / etc.    │ │
│  │                                         │ │
│  │  State: useState + useEffect            │ │
│  │  Fetching: api.get() / api.post()       │ │
│  │  Caching: React Query (useQuery)        │ │
│  └──────────────────┬──────────────────────┘ │
│                     │                        │
│  ┌──────────────────▼──────────────────────┐ │
│  │         api.ts (Axios Instance)         │ │
│  │                                         │ │
│  │  Request Interceptor:                   │ │
│  │    → Attach Authorization: Bearer JWT   │ │
│  │    → Attach X-Organization-ID header    │ │
│  │                                         │ │
│  │  Response Interceptor:                  │ │
│  │    → 401 → attempt token refresh        │ │
│  │    → Retry queued requests on refresh   │ │
│  │    → On refresh fail → logout           │ │
│  └──────────────────┬──────────────────────┘ │
│                     │                        │
└─────────────────────┼────────────────────────┘
                      │ HTTPS
                      ▼
         ┌────────────────────────┐
         │  FastAPI Backend API   │
         │  (see backend README)  │
         └────────────────────────┘
```

---

## Core Modules

### 1. AI Chat Interface

**Component:** `components/AIAssistant.tsx` (34KB)  
**Page:** `pages/Chat.tsx` (22KB)

The AI chat interface supports:
- **Streaming responses** via Server-Sent Events (SSE)
- **Tool execution visualization** — shows which tools the AI called and their results
- **Markdown rendering** with GFM support (tables, code blocks, task lists)
- **Conversation management** — create, switch, delete conversations
- **Provider selection** — switch between OpenAI, Anthropic, Gemini, Ollama at runtime
- **AI action counter** — shows remaining actions based on subscription tier

### 2. Workflow Builder

**Components:** `EnhancedWorkflowCreator.tsx` (93KB), `WorkflowBuilderModal.tsx` (27KB)  
**Page:** `pages/Workflows.tsx` (91KB)

A visual DAG editor built on `@xyflow/react`:
- **Trigger nodes** — HTTP webhook, cron schedule, manual, WhatsApp/Telegram incoming message
- **Action nodes** — Send email, create HubSpot contact, Slack message, AI processing, code execution, conditional branching
- **Connection wires** — Drag to connect nodes, data passes between steps
- **Live execution** — Run workflows from the UI, view step-by-step execution results
- **Templates** — 40+ pre-built workflow templates (lead nurturing, order processing, etc.)

### 3. Unified Inbox

**Page:** `pages/UnifiedInbox.tsx` (107KB)

Aggregates messages from all connected platforms into one view:
- **Sources:** Gmail, Outlook, Slack, WhatsApp, Telegram, Microsoft Teams
- **Features:** Unified threading, read/unread status, reply inline, search, filters by platform
- **AI Integration:** Summarize threads, draft replies, categorize messages

### 4. Unified Task View

**Page:** `pages/UnifiedTaskView.tsx` (142KB)

Cross-platform task management:
- **Sources:** Asana, Jira, Trello, ClickUp, Notion, Todoist, Google Tasks
- **Views:** List, Kanban board, Calendar
- **Actions:** Create, update, mark complete — changes sync back to source platform
- **AI:** Auto-categorize, suggest priority, generate subtasks

### 5. Connections Hub

**Page:** `pages/Connections.tsx` (66KB)

Manages OAuth and API key connections to 30+ platforms:
- **OAuth Flow:** Redirect → callback → token storage (all encrypted server-side)
- **API Key Mode:** Direct key entry for services that support BYOK
- **Connection Health:** Live status checks, re-authentication prompts
- **Platform Categories:** Messaging, CRM, Productivity, Finance, Cloud, Social, AI

### 6. Agent Management

**Page:** `pages/Agents.tsx` (50KB)  
**Component:** `AgentCreatorModal.tsx` (28KB)

Manage autonomous AI agents deployed on WhatsApp and Telegram:
- **Agent Builder:** Configure name, model, knowledge base, system prompt, tools
- **Deployment:** Link to WhatsApp number or Telegram bot
- **Monitoring:** View conversations, response accuracy, execution logs
- **Templates:** Pre-built agent templates (customer service, ordering, FAQ)

---

## Page Catalog

### Authenticated Pages (require login)

| Page | File | Description |
|---|---|---|
| Dashboard | `Dashboard.tsx` | Usage stats, recent activity, quick actions |
| Chat | `Chat.tsx` | AI assistant conversation interface |
| Workflows | `Workflows.tsx` | Visual workflow builder and management |
| Connections | `Connections.tsx` | Integration OAuth management |
| Agents | `Agents.tsx` | WhatsApp/Telegram agent builder |
| Unified Inbox | `UnifiedInbox.tsx` | Cross-platform message aggregation |
| Task View | `UnifiedTaskView.tsx` | Cross-platform task management |
| Calendar | `UnifiedCalendar.tsx` | Cross-platform calendar |
| Marketplace | `Marketplace.tsx` | Agent/workflow template store |
| MCP Tools | `MCPTools.tsx` | Browse available MCP tools |
| Settings | `Settings.tsx` | Account, security, preferences |
| Organization | `OrganizationSettings.tsx` | Team management, roles, billing |
| Payments | `Payments.tsx` | Subscription management, invoices |
| Usage | `Usage.tsx` | Detailed usage analytics |
| Activity | `Activity.tsx` | Audit log viewer |
| WhatsApp Dashboard | `WhatsAppDashboard.tsx` | WhatsApp-specific analytics |
| TikTok Dashboard | `TikTokDashboard.tsx` | TikTok integration dashboard |
| Profile | `Profile.tsx` | User profile editor |
| Agent Hub | `AgentHub.tsx` | Public agent marketplace |

### Public Pages (no auth required)

| Page | File | Description |
|---|---|---|
| Landing | `LandingPage.tsx` | Marketing homepage |
| Pricing | `Pricing.tsx` | Subscription tiers and comparison |
| Login / Register | `Login.tsx`, `Register.tsx` | Authentication |
| Blog | `Blog.tsx`, `BlogPost.tsx` | Content marketing |
| Help & Support | `HelpSupport.tsx` | Documentation and FAQ |
| Creator Profile | `CreatorProfile.tsx` | Public user profiles |
| Integration Pages | `IntegrationPage.tsx` | SEO-optimized integration detail pages |

---

## Component Library

### Layout Components
| Component | Purpose |
|---|---|
| `Layout.tsx` | Authenticated shell — sidebar navigation, top bar, mobile responsive |
| `PublicLayout.tsx` | Marketing shell — header, footer, CTA sections |
| `SEO.tsx` | Dynamic `<title>`, `<meta>`, Open Graph tags via Helmet |

### Feature Components
| Component | Purpose |
|---|---|
| `AIAssistant.tsx` | Floating AI chat panel with streaming support |
| `EnhancedWorkflowCreator.tsx` | Full React Flow-based DAG editor |
| `WorkflowTemplates.tsx` | Template browser with categories and search |
| `AgentCreatorModal.tsx` | Agent configuration wizard |
| `GlobalCommandPalette.tsx` | ⌘K / Ctrl+K command palette for quick navigation |
| `FloatingActionMenu.tsx` | FAB menu for quick actions |
| `TutorialOverlay.tsx` | Interactive onboarding tutorial system |
| `NotificationsDropdown.tsx` | Real-time notification feed |
| `UsageMeter.tsx` | Visual usage quota indicator |
| `UpgradeModal.tsx` | Subscription upgrade prompt |
| `CookieConsent.tsx` | GDPR-compliant cookie banner |
| `EarningsDashboard.tsx` | Creator earnings analytics |

---

## API Client & State Management

### Centralized API Client (`api.ts`)

All backend communication goes through a single Axios instance:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
```

**Request interceptor:** Automatically attaches `Authorization: Bearer <token>` and `X-Organization-ID` headers.

**Response interceptor:**
1. On `401` → attempts silent token refresh via `/auth/refresh`
2. Queues concurrent requests during refresh
3. Retries all queued requests with new token
4. On refresh failure → calls `logout()` and redirects to `/login`

### State Management Strategy

| State Type | Solution | Example |
|---|---|---|
| **Server state** | React Query (`useQuery` / `useMutation`) | Fetching workflows, connections |
| **Auth state** | React Context (`AuthContext`) | Current user, JWT tokens, organization |
| **UI state** | `useState` / `useReducer` | Modal visibility, form state |
| **Theme** | React Context (`ThemeContext`) | Dark/light mode toggle |
| **URL state** | React Router (`useSearchParams`) | Filters, pagination, active tab |

---

## Authentication & Routing

### Auth Flow

```
1. User submits credentials → POST /auth/login
2. Backend returns { access_token, refresh_token, user }
3. Tokens stored in localStorage
4. AuthContext wraps the entire app
5. ProtectedRoute checks AuthContext → redirect to /login if unauthenticated
6. On token expiry → auto-refresh via interceptor
7. On refresh fail → logout + redirect
```

### Route Structure

```
/                    → LandingPage (public)
/login               → Login
/register            → Register
/dashboard           → Dashboard (protected)
/chat                → Chat (protected)
/workflows           → Workflows (protected)
/connections         → Connections (protected)
/agents              → Agents (protected)
/inbox               → UnifiedInbox (protected)
/tasks               → UnifiedTaskView (protected)
/calendar            → UnifiedCalendar (protected)
/marketplace         → Marketplace (protected)
/settings            → Settings (protected)
/organization        → OrganizationSettings (protected)
/payments            → Payments (protected)
/pricing             → Pricing (public)
/blog                → Blog (public)
/integrations/:slug  → IntegrationPage (public)
```

---

## Design System

### Theming

- **Dark/Light mode** via `ThemeToggle.tsx` — persisted to localStorage
- **Tailwind Config** defines custom colors, breakpoints, and animations
- **Component variants** use `clsx` for conditional class merging

### Responsive Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

### Typography
- **Font:** System font stack (via Tailwind defaults)
- **Prose:** `@tailwindcss/typography` for AI-generated markdown rendering

---

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Local Development

```bash
# Clone and navigate
cd arrotech-hub-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set VITE_API_URL to your backend (default: http://localhost:8000)

# Start dev server with HMR
npm start
# → Opens at http://localhost:5173
```

### Environment Variables

```bash
VITE_API_URL=http://localhost:8000    # Backend API URL
VITE_PAYSTACK_PUBLIC_KEY=pk_test_... # Paystack checkout
VITE_GA_MEASUREMENT_ID=G-...         # Google Analytics
VITE_APP_ENV=development              # Environment indicator
```

---

## Build & Deployment

### Production Build

```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview

# Analyze bundle size
npm run analyze
```

The build process:
1. `vite build` — TypeScript compilation, tree-shaking, code splitting, minification
2. `node prerender.mjs` — Pre-renders static marketing pages for SEO

### Deployment

The frontend is deployed to **Railway** (or any static hosting) via GitHub Actions.

**Output:** `dist/` directory containing:
- `index.html` — SPA entry point
- `assets/` — Hashed JS/CSS chunks
- Pre-rendered HTML for marketing pages

### Performance Optimizations
- **Code splitting** — Route-based lazy loading via `React.lazy()`
- **Tree shaking** — Unused exports removed by Vite/Rollup
- **PWA** — Service worker for offline support via `vite-plugin-pwa`
- **Asset hashing** — Long-term caching with content-hash filenames
- **Bundle analysis** — `rollup-plugin-visualizer` via `npm run analyze`