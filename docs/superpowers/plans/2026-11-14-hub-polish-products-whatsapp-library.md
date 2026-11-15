# Hub Polish — Products + WhatsApp Settings + Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one coherent Hub polish wave: Commerce Products desk (full CRUD + photo), WhatsApp Settings visual/structural polish (behavior unchanged), and Library cards + deploy modal look/mobile polish (deploy payloads unchanged).

**Architecture:** Shared Hub polish class tokens for section/field/modal chrome. Products page on existing `/api/catalog/products` with thin backend `attach_stored_image` on create/PATCH. Settings UI extracted from `WhatsAppDashboard` into a presentational panel wired to existing handlers. Library restyles gallery + modal shell in `WorkflowTemplates` without rewriting `useTemplate` assembly.

**Tech Stack:** React/TypeScript Hub, Tailwind, existing `apiService`, Jest/RTL (match `CommerceReturns.test.tsx`), FastAPI `catalog_router` + `attach_stored_image`.

**Spec:** `docs/superpowers/specs/2026-11-14-hub-polish-products-whatsapp-library-design.md`  
**Supersedes plan:** `docs/superpowers/plans/2026-11-14-hub-products-desk.md` (do not implement that plan separately)

## Global Constraints

- One coordinated ship; reuse Hub Commerce/WhatsApp visual language — no second brand, no generic purple-on-white rewrite of whole Hub.
- Products: reuse `catalog_products` + `/api/catalog/products`; Builder stays bulk; availability writes `in_stock` | `out_of_stock`; unavailable primary, delete confirm-secondary.
- WhatsApp Settings: visual/structural only — keep register/deregister, save profile, save hours, save inbox, Meta connect.
- Library: restyle cards + modal hierarchy/mobile; do not change `useTemplate` / deploy field payload assembly.
- Frontend branch: `feat/whatsapp-ordering-commerce-rails-hub`. Backend image work: commerce-rails worktree/`feat/whatsapp-ordering-commerce-rails` (or equivalent PR to `develop`).
- Frontend `npm test` is a stub; write Jest/RTL files like `CommerceReturns.test.tsx` and run with `npx jest <path>` (install jest runner if missing). Backend: project pytest as usual.

## Review Focus

- Empty catalog → empty state + Add CTA; no fake rows.
- Photo on create/edit persists public `image_url` (not blob-only preview).
- Mark unavailable → `out_of_stock` patch; product remains listed under unavailable filter.
- Delete cancel leaves product; confirm removes it.
- Settings save profile / save hours / save inbox still call the same `apiService` methods after extract.
- Library Deploy still calls `apiService.useTemplate(templateId, configValues)` with the same `configValues` shape.
- Settings + Library remain usable on narrow mobile viewports (no horizontal trap in modal).

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/hubPolish.ts` | Shared Tailwind class strings: section shell, section header, field group, modal frame/backdrop |
| `arrotech-hub-backend/src/routers/catalog_router.py` | Run create/PATCH through `attach_stored_image` when image fields present |
| `arrotech-hub-backend/tests/test_catalog_products_desk_api.py` | Image-on-create/PATCH |
| `src/services/api.ts` | `listCatalogProducts`, `createCatalogProduct`, `updateCatalogProduct`, `deleteCatalogProduct` |
| `src/pages/CatalogProducts.tsx` | Products desk |
| `src/__tests__/pages/CatalogProducts.test.tsx` | Products RTL |
| `src/App.tsx` | Route `/catalog` |
| `src/components/Layout.tsx` | Commerce → Products nav |
| `src/components/whatsapp/WhatsAppSettingsPanel.tsx` | Settings tab UI (presentational) |
| `src/pages/WhatsAppDashboard.tsx` | Wire panel; keep handlers/state |
| `src/__tests__/components/WhatsAppSettingsPanel.test.tsx` | Settings smoke |
| `src/components/WorkflowTemplates.tsx` | Cards + deploy modal chrome |
| `src/__tests__/components/WorkflowTemplates.polish.test.tsx` | Card/modal render + deploy still calls `useTemplate` |

---

### Task 1: Shared polish tokens

**Files:**
- Create: `arrotech-hub-frontend/src/lib/hubPolish.ts`

**Interfaces:**
- Produces: exported string constants, e.g. `hubSection`, `hubSectionHeader`, `hubFieldLabel`, `hubModalBackdrop`, `hubModalFrame`, `hubPrimaryBtn`, `hubDangerBtn` — Tailwind class bundles aligned with Returns/Orders density (slate borders, rounded-2xl, dark: variants). No new CSS package.

- [ ] **Step 1: Add `hubPolish.ts` with the exported class constants above** (values chosen to match Commerce Returns section chrome; Library/Settings import these later)

- [ ] **Step 2: Commit** `style(hub): shared polish class tokens`

---

### Task 2: Catalog image-on-write + client methods

**Files:**
- Modify: `arrotech-hub-backend/src/routers/catalog_router.py` (`create_catalog_product`, `patch_catalog_product`)
- Create: `arrotech-hub-backend/tests/test_catalog_products_desk_api.py`
- Modify: `arrotech-hub-frontend/src/services/api.ts`

**Interfaces:**
- Produces (backend): before `create_product` / `update_product`, `payload = await attach_stored_image(user.id, payload)` so `image_base64` / `image_url` / `_image` / Builder-compatible fields persist `image_url`
- Produces (frontend):
  - `listCatalogProducts(params?: { q?: string; limit?: number; offset?: number }): Promise<ApiResponse<{ products: any[] }>>` → `GET /api/catalog/products`
  - `createCatalogProduct(data: Record<string, unknown>): Promise<ApiResponse<any>>` → `POST /api/catalog/products`
  - `updateCatalogProduct(productId: string, data: Record<string, unknown>): Promise<ApiResponse<any>>` → `PATCH /api/catalog/products/{id}`
  - `deleteCatalogProduct(productId: string): Promise<ApiResponse<{ id: string }>>` → `DELETE /api/catalog/products/{id}`

- [ ] **Step 1: Write failing backend test** — PATCH (and create) with tiny `image_base64` fixture yields stored `image_url` on response (mock `persist_product_image` / storage as existing catalog tests do)

- [ ] **Step 2: Run pytest on that file** — expect FAIL (create/PATCH ignore image today)

- [ ] **Step 3: Wire `attach_stored_image` into create + PATCH**

- [ ] **Step 4: Run pytest** — PASS

- [ ] **Step 5: Add the four `api.ts` methods** in the same style as `listCommerceReturns`

- [ ] **Step 6: Commit** backend then frontend: `feat(catalog): image-aware product write for Products desk`

---

### Task 3: Products desk — list, filters, nav

**Files:**
- Create: `src/pages/CatalogProducts.tsx`
- Create: `src/__tests__/pages/CatalogProducts.test.tsx`
- Modify: `src/App.tsx`, `src/components/Layout.tsx`

**Interfaces:**
- Route `/catalog` → lazy `CatalogProducts`
- Nav: Commerce → **Products** (`/catalog`) above or beside Catalog Builder; keep Builder
- UI: search → `listCatalogProducts({ q })`; filter chips `all | in_stock | out_of_stock` (client filter on `availability` if API has no availability query); desktop table columns thumb, name, price, qty, availability; mobile stacked cards; empty “No products yet” + Add; loading; error via `mapApiError` + toast
- Import `hubPolish` section chrome

- [ ] **Step 1: Write failing RTL tests** — loads list via `listCatalogProducts`; empty state when `products: []`; typing search calls list with `q`

- [ ] **Step 2: Run jest on the test file** — expect FAIL

- [ ] **Step 3: Implement list page + route + nav** (visual bar: match Returns spacing/type)

- [ ] **Step 4: Run jest** — PASS

- [ ] **Step 5: Commit** `feat(hub): Products desk list and nav`

---

### Task 4: Products — add, edit + photo, unavailable, delete

**Files:**
- Modify: `src/pages/CatalogProducts.tsx`
- Modify: `src/__tests__/pages/CatalogProducts.test.tsx`

**Interfaces:**
- **Add / Edit panel:** side drawer desktop, full-height sheet mobile; fields name, price, description, category, brand, sku, quantity, availability, photo file → encode base64 (`image_base64` + optional `image_filename` / content type) like Builder
- Add → `createCatalogProduct`; Save edit → `updateCatalogProduct`
- **Mark unavailable:** `updateCatalogProduct(id, { availability: 'out_of_stock' })` without delete
- **Delete:** confirm → `deleteCatalogProduct`; cancel does not call delete
- Photo preview local until save; after save list shows `image_url`

- [ ] **Step 1: Write failing tests** — add→create; edit save→update; unavailable→`out_of_stock`; delete confirm→delete; cancel delete→no delete

- [ ] **Step 2: Run jest** — expect FAIL

- [ ] **Step 3: Implement add/edit/photo/unavailable/delete**

- [ ] **Step 4: Run jest** — PASS

- [ ] **Step 5: Commit** `feat(hub): Products desk add edit unavailable delete`

---

### Task 5: WhatsApp Settings extract + polish

**Files:**
- Create: `src/components/whatsapp/WhatsAppSettingsPanel.tsx`
- Modify: `src/pages/WhatsAppDashboard.tsx` (replace `activeTab === 'settings'` JSX ~1191–1645 with `<WhatsAppSettingsPanel ... />`; leave registration/deregister modals in dashboard or pass through as props — prefer panel owns section chrome, dashboard keeps modal state + handlers)
- Create: `src/__tests__/components/WhatsAppSettingsPanel.test.tsx`

**Interfaces:**
- `WhatsAppSettingsPanel` props: connection, phone numbers, business profile state + setters, inbox settings state + setters, team members as needed, and callbacks: `onConnectMeta`, `onSyncNumbers`, `onSaveProfile`, `onSaveHours`, `onSaveInbox`, `onOpenRegister`, `onOpenDeregister`, loading flags (`isSavingProfile`, `isSavingHours`, `isSyncingNumbers`, …)
- Visual: use `hubPolish` section/field classes; clearer hierarchy Connection → Phone numbers → Business profile → Hours → Team inbox; responsive stack; **no API contract changes**
- Dashboard: handlers unchanged (`updateWhatsAppBusinessProfile`, `updateWhatsAppInboxSettings`, register/deregister, etc.)

- [ ] **Step 1: Write failing smoke tests** — renders Connected Account / Business Profile / Save labels when props provided; clicking Save profile / Save hours / Save inbox invokes the respective callbacks (mock props)

- [ ] **Step 2: Run jest** — expect FAIL

- [ ] **Step 3: Extract markup into panel + apply polish classes; wire from dashboard**

- [ ] **Step 4: Run jest** — PASS; manually smoke that dashboard still compiles (`npm run build` or tsc if slow — at least jest + no broken imports)

- [ ] **Step 5: Commit** `feat(hub): polish WhatsApp Settings panel`

---

### Task 6: Library cards + deploy modal polish

**Files:**
- Modify: `src/components/WorkflowTemplates.tsx` (grid cards ~413+, list cards if present, deploy modal ~516+)
- Create: `src/__tests__/components/WorkflowTemplates.polish.test.tsx`

**Interfaces:**
- Cards: use `hubPolish` + elevated gallery look (stronger type hierarchy, calmer borders, better mobile single-column); reduce loud purple-hover dominance toward Hub slate/emerald accents consistent with Commerce — keep category color accent as a thin signal, not the whole theme
- Modal: `hubModalBackdrop` / `hubModalFrame`; sticky header with title + close; scrollable body; grouped sections (overview / connections / config fields / tags); sticky footer Deploy; mobile full-bleed sheet
- **Do not change** `handleUseTemplate` / `configValues` assembly / `apiService.useTemplate` arguments

- [ ] **Step 1: Write failing tests** — with mocked `getTemplates`/`useTemplate`, open a template card → modal shows template name; click Deploy → `useTemplate` called with same id + config object shape (spy); modal root has dialog-ish role or accessible title

- [ ] **Step 2: Run jest** — expect FAIL (or fail on missing a11y hooks until added)

- [ ] **Step 3: Restyle cards + modal chrome/sections; add `role="dialog"` + labelled title if missing

- [ ] **Step 4: Run jest** — PASS

- [ ] **Step 5: Commit** `feat(hub): polish Library cards and deploy modal`

---

### Task 7: Coherence pass

**Files:**
- Touch only if drift found: `hubPolish.ts`, Products, Settings panel, WorkflowTemplates
- Run: `npm run lint:ui` if it applies to these paths

**Interfaces:**
- Consumes: all three surfaces import shared tokens for section/modal chrome
- Produces: no behavior changes — spacing/type/button alignment consistency only

- [ ] **Step 1: Side-by-side check** Products / Settings / Library against Review Focus mobile + empty/error paths; fix token drift only

- [ ] **Step 2: Run** Products + Settings + Library jest files + backend image test — all PASS

- [ ] **Step 3: Commit** if fixes: `fix(hub): align polish surfaces` — else skip empty commit

---

## Self-review notes (author)

- Spec coverage: Products table/edit/photo/add/unavailable/delete; Settings visual-only; Library cards/modal look; shared language; thin image API — Tasks 1–6.
- Review Focus each line pinned in Tasks 2–6 tests.
- Non-goals respected: no new DB, no Conversations/Broadcast rewrite, no deploy/register logic change.
- Proportion: signatures + test names/assertions; no full component transcripts.
