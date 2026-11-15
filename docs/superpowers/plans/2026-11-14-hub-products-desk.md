# Hub Products Desk — Implementation Plan

> **SUPERSEDED:** Do not implement this plan. Use `2026-11-14-hub-polish-products-whatsapp-library.md` (Products + WhatsApp Settings + Library).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an industry-standard Hub Commerce → Products desk so merchants can list, search, add, fully edit (including photo), mark unavailable, and optionally delete live `catalog_products` without using Catalog Builder for day-to-day ops.

**Architecture:** Frontend Products page on existing `/api/catalog/products` CRUD. Thin backend tweak so create/PATCH accept the same image payload path as Builder (`attach_stored_image`). Match Orders/Returns Hub patterns: responsive table + detail/edit panel.

**Tech Stack:** React/TypeScript Hub, existing `apiService`, Vitest/RTL page tests, FastAPI catalog router + `catalog_image_service`.

**Spec:** `docs/superpowers/specs/2026-11-14-hub-products-desk-design.md`

## Global Constraints

- Reuse `catalog_products` and `/api/catalog/products` — no new product table.
- Catalog Builder remains bulk intake; Products is the live desk.
- Full edit includes photo replace; Add product from this screen.
- Primary stop-selling: mark `out_of_stock` / unavailable; Delete is confirm-secondary.
- Aesthetic, responsive phone→desktop; preserve Hub design system; industry table UX (search, filters, empty/loading/error).
- Ship on frontend branch PR-able to `develop` (prefer extending `feat/whatsapp-ordering-commerce-rails-hub` or equivalent).

## Review Focus

- Empty catalog → clear empty state + Add CTA; never fake rows.
- Mark unavailable → availability unsellable; WhatsApp rails already skip non-sellable (no agent change required unless regression).
- Photo replace on edit persists public `image_url` (not blob-only preview).
- Delete requires confirm and removes row from list; cancel leaves product.
- Search `q` filters server list; unavailable filter does not hide in-stock items incorrectly.

---

## File map

| File | Responsibility |
|------|----------------|
| `arrotech-hub-backend/src/routers/catalog_router.py` | Run create/PATCH payloads through `attach_stored_image` when image fields present |
| `arrotech-hub-backend/tests/test_catalog_router.py` (or new focused test) | Image-on-PATCH / create with base64 or url |
| `src/services/api.ts` | `listCatalogProducts`, `createCatalogProduct`, `updateCatalogProduct`, `deleteCatalogProduct` |
| `src/pages/CatalogProducts.tsx` | Products desk UI |
| `src/__tests__/pages/CatalogProducts.test.tsx` | RTL coverage |
| `src/App.tsx` | Route `/catalog` |
| `src/components/Layout.tsx` | Commerce → Products nav |

---

### Task 1: Catalog API image-on-write + client methods

**Files:**
- Modify: `arrotech-hub-backend/src/routers/catalog_router.py` (`create_catalog_product`, `patch_catalog_product`)
- Test: `arrotech-hub-backend/tests/test_catalog_products_desk_api.py` (create if catalog router tests are awkward to extend)
- Modify: `arrotech-hub-frontend/src/services/api.ts`
- Test: optional thin frontend mock unit not required if page tests cover calls

**Interfaces:**
- Produces: create/PATCH accept product JSON; if `image_base64` / `image_url` / Builder-compatible image fields present, persist via `attach_stored_image` then create/update
- `apiService.listCatalogProducts(params?: { q?: string; limit?: number; offset?: number })`
- `apiService.createCatalogProduct(data: Record<string, unknown>)`
- `apiService.updateCatalogProduct(productId: string, data: Record<string, unknown>)`
- `apiService.deleteCatalogProduct(productId: string)`
- Availability write values: `in_stock` | `out_of_stock` (match catalog_service defaults)

- [ ] **Step 1: Write failing backend test** — PATCH with `image_base64` (tiny fixture) results in stored `image_url` on serialized product (mock `store_catalog_image` / `persist_product_image` if needed)

- [ ] **Step 2: Run** — expect FAIL (PATCH ignores image today)

- [ ] **Step 3: Wire `attach_stored_image` into create + PATCH** before `create_product` / `update_product`

- [ ] **Step 4: Run backend test** — PASS

- [ ] **Step 5: Add api.ts client methods** matching existing commerce API style (`success` / `data`)

- [ ] **Step 6: Commit** backend then frontend (or one commit per repo): `feat(catalog): image-aware product write for Products desk`

---

### Task 2: Products desk page (list + filters + empty/loading)

**Files:**
- Create: `src/pages/CatalogProducts.tsx` (list shell first; edit panel can be stub until Task 3 if needed — prefer one page file)
- Create: `src/__tests__/pages/CatalogProducts.test.tsx`
- Modify: `src/App.tsx`, `src/components/Layout.tsx`

**Interfaces:**
- Route `/catalog` → `CatalogProducts`
- Nav: Commerce → **Products** (`/catalog`), keep Catalog Builder
- UI: search box bound to `q`; filter chips `all | in_stock | out_of_stock`; table columns thumb, name, price, qty, availability; mobile stacked cards; empty state “No products yet” + Add; loading spinner; error toast via `mapApiError`

- [ ] **Step 1: Write failing RTL tests** — loads list via `listCatalogProducts`; empty state when `products: []`; search calls list with `q`

- [ ] **Step 2: Run** — expect FAIL

- [ ] **Step 3: Implement page list + nav + route** (visual quality bar: match Returns/Orders spacing/type, not a sparse prototype)

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** `feat(hub): Products desk list and nav`

---

### Task 3: Add, full edit (incl. photo), unavailable, delete

**Files:**
- Modify: `src/pages/CatalogProducts.tsx`
- Modify: `src/__tests__/pages/CatalogProducts.test.tsx`

**Interfaces:**
- **Add:** form/panel → `createCatalogProduct` with name, price, description, category, brand, sku, quantity, availability, optional image (file → base64 or reuse Builder encoding helper pattern)
- **Edit:** open row → same fields; save → `updateCatalogProduct`; photo replace updates preview then persists on save
- **Mark unavailable:** sets `availability` to `out_of_stock` (button on row or edit); does not delete
- **Delete:** confirm dialog → `deleteCatalogProduct` → row gone; cancel keeps row
- Builder call: edit as side panel/drawer on desktop, full-screen sheet on mobile — pick one consistent with Hub density

- [ ] **Step 1: Write failing tests** — add calls create; edit save calls update; mark unavailable patches `out_of_stock`; delete confirm calls delete; cancel delete does not

- [ ] **Step 2: Run** — expect FAIL

- [ ] **Step 3: Implement add/edit/unavailable/delete + photo input**

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** `feat(hub): Products desk add edit unavailable delete`

---

## Self-review notes (author)

- Spec coverage: table, full edit+photo, add, unavailable, delete, nav, no new DB — mapped to tasks.
- Review Focus lines pinned in Task 2–3 tests + Task 1 image persistence.
- No Catalog Builder rewrite; no variants.
