# Arrotech Hub

> **An AI-native operations platform for multi-tenant workflow automation, conversational agents, and 30+ integration orchestration.**

[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20MCP-009688?style=flat-square)](#backend)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=flat-square)](#frontend)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#)

---

## What is Arrotech Hub?

Arrotech Hub is a **production-grade AI operations platform** built on the **Model Context Protocol (MCP)**. It enables businesses to:

- 🤖 **Chat with AI** that autonomously selects and executes tools across CRM, email, payments, file management, and more
- ⚡ **Build visual workflows** (Zapier/Make-style) triggered by webhooks from WhatsApp, Telegram, Slack, Gmail
- 📱 **Deploy conversational agents** on WhatsApp/Telegram for ordering, customer service, and M-Pesa payments
- 📚 **Create knowledge bases** via a RAG pipeline ingesting from 10+ sources into vector databases
- 🔗 **Connect 30+ platforms** — Google Workspace, HubSpot, Salesforce, Slack, Jira, Notion, Stripe, M-Pesa, and more

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────┐
│                  CLIENT LAYER                    │
│  React SPA  │  WhatsApp  │  Telegram  │  MCP    │
└──────┬──────┴──────┬─────┴──────┬─────┴────┬────┘
       │             │            │          │
       ▼             ▼            ▼          ▼
┌─────────────────────────────────────────────────┐
│           FASTAPI + MCP BACKEND                  │
│                                                 │
│  AI Engine → Tool Executor → 105+ Services      │
│  RAG Pipeline → Vector DBs (Pinecone/Qdrant)   │
│  Workflow Engine → Visual DAG Execution          │
│  Observability → ELK + Prometheus + Grafana     │
│                                                 │
│  PostgreSQL + Redis + Alembic Migrations        │
└─────────────────────────────────────────────────┘
```

---

## Repository Structure

```
Hub/
├── arrotech-hub-backend/    # FastAPI + MCP backend
│   ├── src/                 # Application source code
│   │   ├── services/        # 105+ service modules
│   │   ├── routers/         # 63 API routers
│   │   ├── models/          # SQLAlchemy data models
│   │   ├── observability/   # Logging, tracing, DLQ
│   │   └── main.py          # Entry point
│   ├── docker-compose.yml   # Full stack (app + DB + ELK + monitoring)
│   └── README.md            # ← Backend technical docs
│
├── arrotech-hub-frontend/   # React + TypeScript SPA
│   ├── src/
│   │   ├── components/      # 26 components + 7 subdirectories
│   │   ├── pages/           # 48 page components
│   │   ├── api.ts           # Centralized Axios client
│   │   └── App.tsx          # Root component
│   └── README.md            # ← Frontend technical docs
│
└── README.md                # ← You are here
```

---

## Quick Start

### Backend

```bash
cd arrotech-hub-backend
cp env.example .env          # Configure API keys
docker-compose up -d         # Start full stack
# → API at http://localhost:8000/docs
```

### Frontend

```bash
cd arrotech-hub-frontend
npm install
npm start
# → App at http://localhost:5173
```

---

## Documentation

| Document | Description |
|---|---|
| [**Backend README**](./arrotech-hub-backend/README.md) | Architecture, core abstractions, service catalog, observability, deployment |
| [**Frontend README**](./arrotech-hub-frontend/README.md) | Component library, state management, routing, build pipeline |

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| **MCP Protocol** | Open standard for LLM ↔ tool communication. Enables both HTTP API and Claude Desktop integration from the same codebase. |
| **Provider-Agnostic LLM** | `LLMService` abstracts 6 providers. Users can BYOK or use platform keys. |
| **Async-First Python** | `asyncpg` + `aiohttp` + `asyncio` for non-blocking I/O across all service calls. |
| **Multi-Tenant by Default** | Every query scoped to `user_id`/`organization_id`. Vector namespaces are tenant-isolated. |
| **Observability Built-In** | Structured JSON logs + distributed tracing + DLQ. Not bolted on — woven into middleware and tool wrappers. |
| **Feature Gating** | `FeatureGate` class controls access by subscription tier (Free/Pro/Enterprise). Write ops blocked on Free. |
