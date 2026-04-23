# Arrotech Hub Frontend

Web client for Arrotech Hub, built with React + TypeScript.  
This application is the operational UI for a multi-tenant AI automation platform, covering:

- unified productivity workspace (dashboard, inbox, task and calendar views),
- AI chat and tool-assisted execution,
- integrations and OAuth connection management,
- workflow design/execution surfaces,
- marketplace and creator experiences,
- organization onboarding and team context switching,
- payments and subscription flows,
- public growth pages (landing, pricing, blog, legal, comparison/use-case pages).

## Product Scope (Current State)

This frontend is both:

1. **A public marketing/SEO surface** (landing, pricing, blog, legal, integration pages), and  
2. **A protected application workspace** for authenticated users and organizations.

It is designed as a single-page app with lazy-loaded routes, guarded navigation, shared API client abstractions, and a typed domain model layer.

## Frontend Architecture

### App Shell and Providers

`src/App.tsx` composes global providers and app concerns:

- `HelmetProvider` for metadata/SEO handling
- `AuthProvider` for auth/session/user/org state
- `CommandProvider` for global command palette behavior
- `TutorialProvider` for guided onboarding UX
- route-level lazy loading with `Suspense`
- globally mounted UI utilities (tutorial overlay, floating action menu, command palette)

### Route Design

Routing is split into:

- **public routes** (`/`, `/pricing`, `/blog`, `/privacy`, `/terms`, etc.)
- **auth-public routes** (`/login`, `/register`, `/forgot-password`, `/reset-password`)
- **protected routes** (`/unified`, `/connections`, `/workflows`, `/chat`, `/settings`, etc.)
- **verification-sensitive routes** guarded by email verification checks
- **special callback routes** for OAuth providers (example: Microsoft callback)

Key route wrappers:

- `PublicRoute` redirects authenticated users to workspace
- `ProtectedRoute` enforces login
- `RequireVerifiedEmail` enforces verified user state before core app access

### State and Data Access

- API access is centralized in `src/services/api.ts` (Axios-based, token handling, refresh flow).
- Auth and org context is centralized in `src/hooks/useAuth.tsx`.
- Organization switching updates auth token and active org context.
- Domain types are maintained in `src/types/index.ts` with broad coverage across platform modules.

## Functional Modules

### 1) Authentication and Account

- email/password login and registration
- password reset and token validation flows
- Google and Microsoft login paths
- multi-step 2FA flows (TOTP, backup code, email OTP)
- email verification and resend verification UX
- user profile/account update paths

### 2) Unified Workspace

- `/unified` main workspace dashboard
- `/unified/inbox` communication center
- `/unified/tasks` unified task view
- `/unified/calendar` unified calendar view

These screens are designed as productivity “command center” surfaces rather than isolated point pages.

### 3) AI Chat and Tooling

- chat conversations with persisted history
- streaming message support (delta/thinking/tool events)
- provider discovery and capability exploration
- tool context/result rendering components
- chat-to-workflow extraction support

### 4) Integrations and Connected Platforms

- integration CRUD and test flows
- OAuth callbacks and post-auth handoff
- platform-specific operations for communication, CRM, social, productivity, and accounting providers
- WhatsApp-specific contacts/messages/auto-reply/business profile and analytics views
- TikTok-specific creator tools, content, and monetization flows

### 5) Workflows and Automation

- workflow creation/update/deletion/execution
- execution history and step-level visibility
- condition/variable testing helpers
- workflow templates and assistant-assisted generation
- agent endpoints exposed through the same API layer

### 6) Marketplace and Creator Ecosystem

- marketplace browsing and workflow import surfaces
- favorites and creator profile pages
- workflow reviews/ratings typed models
- creator analytics, earnings, follower/activity primitives

### 7) Payments and Billing

- M-Pesa flows
- Stripe subscription/payment-intent flows
- Paystack verification/config paths
- usage and billing history surfaces

### 8) Organization and Team Context

- onboarding and organization creation pages
- organization settings and invitation acceptance
- active organization switching in auth context
- role-aware app behavior powered by backend role data

### 9) Public Growth and Trust Pages

- landing page, pricing page
- use-case/integration/comparison pages for acquisition SEO
- blog index and blog post pages
- legal and support pages

## Tech Stack

- React 18 + TypeScript
- Vite build pipeline
- React Router v6
- Axios for API client abstraction
- Tailwind CSS for utility-first styling
- React Hook Form for form handling
- `@xyflow/react` for workflow canvas rendering
- Recharts for charting/analytics visuals
- React Hot Toast for notification UX

## PWA and Build Design

Configured in `vite.config.ts`:

- PWA manifest (`Arrotech Hub`) with installable app metadata
- Workbox runtime caching strategies
- vendor chunk splitting for optimized bundle loading
- output to `build/`
- sourcemap behavior tied to mode

## API Integration Surface

`src/services/api.ts` includes a large typed surface that covers:

- auth/account (`/auth/*`)
- connections (`/connections*`)
- chat (`/chat*`)
- workflows (`/workflows*`)
- agents (`/agents*`)
- payments (`/payments*`)
- status/pricing/usage (`/api/v1/*`)
- organization flows
- provider callback handling for multiple integrations
- WhatsApp, TikTok, Power BI, Teams, Zoom, Salesforce, Asana, and others

The frontend API layer is intentionally broad because the platform itself is broad.

## Type System and Domain Modeling

`src/types/index.ts` models many backend entities and responses, including:

- users, subscriptions, connections
- conversations/messages/tool events
- workflows, executions, templates, marketplace metadata
- notifications/followers/activity
- payments and reconciliation records
- developer app and API entities
- organization/team structures

This keeps feature code strongly typed and reduces runtime ambiguity across modules.

## Project Structure

```text
arrotech-hub-frontend/
├── src/
│   ├── App.tsx                    # Route composition + global providers
│   ├── components/                # Shared UI, chat/workflow/settings components
│   ├── pages/                     # Route-level page modules
│   ├── hooks/                     # Auth, streaming, tutorial, and custom behavior hooks
│   ├── services/
│   │   ├── api.ts                 # Central backend API client
│   │   └── organizationService.ts # Organization-specific client methods
│   ├── contexts/                  # Global context providers
│   └── types/                     # TypeScript domain contracts
├── vite.config.ts                 # Build + PWA + caching behavior
├── package.json                   # Scripts and dependencies
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18+
- npm
- backend running (default expected API target: `http://localhost:8000`)

### Setup

```bash
npm install
npm start
```

Default dev app URL is Vite-served local URL.

### Environment

Create `.env` in project root:

```env
VITE_API_URL=http://localhost:8000
```

The app also includes local proxy support in `package.json`.

## Scripts

- `npm start` - run Vite dev server
- `npm run build` - production build + prerender step
- `npm run build:dev` - development-mode build
- `npm run preview` - preview production bundle
- `npm run analyze` - analyze bundle output
- `npm test` - placeholder test script (currently disabled in this repo state)

## UX and Design Intent

The frontend design direction is:

- **single-entry workspace** for day-to-day operators,
- **low-friction onboarding** for new users and new organizations,
- **progressive disclosure** of advanced automation features,
- **route-guarded trust boundaries** (public vs protected vs verified),
- **typed, service-driven integration** rather than ad-hoc fetch patterns.

This makes the app capable of serving marketing, operations, creators, and enterprise/team users within one coherent frontend system.

## Deployment Notes

- Build output directory: `build/`
- Can be deployed as static assets behind CDN/reverse proxy
- Designed to pair with Arrotech Hub backend environments and CORS allow-list settings

## Repository Fit

This frontend is not just a dashboard skin. It is the primary product interface for the wider Arrotech Hub platform and reflects the backend’s current multi-domain breadth: automation, integrations, AI operations, monetization, and team workflows.