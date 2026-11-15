# Hub Polish — Products Desk + WhatsApp Settings + Library

**Date:** 2026-11-14  
**Status:** Approved  
**Size:** Project (one coordinated frontend polish ship)  
**Supersedes for planning:** `2026-11-14-hub-products-desk-design.md` (Products decisions carried forward; this doc is the ship contract)

## Intent and why

Raise three merchant-facing Hub surfaces to an industry-standard visual and structural bar in one ship: (1) a real **Products** desk for day-to-day catalog ops, (2) **WhatsApp → Settings** polish so connection/profile/hours/inbox feel modern and usable on phone and desktop, (3) **Automations → Library** gallery cards and **deploy modal** that look world-class without changing deploy submit logic.

Merchants currently: cannot edit live products in a proper table UI; WhatsApp Settings is a dense card stack inside a mega-file; Library cards/modal feel toolkit-generic. Kenya go-live trust depends on Hub looking as serious as the WhatsApp commerce agent.

## Goals

### Products desk
- Commerce → Products (`/catalog`): industry-standard searchable/filterable table (thumb, name, price, qty, availability).
- Full edit including photo; Add one product; mark unavailable/out of stock as primary stop-sell; delete secondary with confirm.
- Catalog Builder remains bulk intake.

### WhatsApp → Settings
- Visual/structural polish of existing sections: connection, business profile, hours, inbox settings.
- Responsive, clear hierarchy, modern Hub chrome — **same behaviors** (register/deregister, save profile, save inbox, hours).

### Library
- Aesthetic, responsive template cards (grid + usable mobile).
- Deploy/use **modal** look-first: layout, hierarchy, mobile — **same field logic and submit** unless regrouping for clarity of required vs optional without changing payloads.

### Shared
- One coherent Hub visual language across the three surfaces (type, spacing, section patterns, breakpoints).
- Thin backend only where Products image-on-create/PATCH needs `attach_stored_image`.

## Non-goals

- New product DB / replacing `catalog_products`.
- Redesigning WhatsApp Conversations, Broadcast, Auto-reply tabs (except Settings tab).
- Changing Library deploy backend contracts or WhatsApp Graph register flows.
- Full Hub design-system megaproject / re-theming the whole app.
- Variants, collections, multi-warehouse.

## Anti-goals

- Three different visual languages across Products / Settings / Library.
- Look polish that breaks register, hours save, or template deploy.
- Price/stock-only Products screen.
- Shipping half-finished Library modal that still feels like a raw form dump.

## Constraints

- Frontend: React Hub; match and elevate existing Commerce/WhatsApp patterns; user frontend design rules (expressive type where Hub allows, avoid generic AI purple/cream tropes; preserve established Hub system rather than inventing a second brand).
- Backend: existing catalog CRUD; wire image attach on create/PATCH if needed.
- Ship branch: extend `feat/whatsapp-ordering-commerce-rails-hub` (or equivalent develop-based Hub branch) so polish lands with commerce Hub work where practical.
- Hours source of truth for ordering remains Commerce Policy (already decided); WhatsApp Settings hours stay editable as today for WhatsApp profile — do not invent a new sync project in this ship unless already trivial.

## Approaches considered

| Approach | Summary | Tradeoff |
|----------|---------|----------|
| 1. Three separate PRs | Products → Settings → Library | Cleaner diffs; slow; visual drift |
| **2. One coordinated polish wave (chosen)** | Shared visual language; Products + Settings + Library (+ thin catalog image API) | Larger PR; coherent Hub |
| 3. Design-system first | Tokens/components then screens | Delays merchant-visible win |

**Chosen:** Approach 2 (partner confirmed).

## Decided product behavior

| Topic | Decision |
|-------|----------|
| Ship | Products + WA Settings polish + Library cards/modal together |
| Products | Table + full edit+photo + add; unavailable first; delete confirm |
| WA Settings | Visual/structural only; keep register/deregister/saves |
| Library modal | Look/hierarchy/mobile; keep deploy field logic |
| Builder | Bulk only; Products for live catalog |

## Builder calls

- Extract WhatsApp Settings tab UI into a focused component/module if that keeps the polish maintainable — behavior stays wired to existing handlers in `WhatsAppDashboard`.
- Library: restyle cards + modal shell/sections; do not rewrite `useTemplate` payload assembly.
- Products: desktop table + mobile cards; edit drawer/panel consistent with Returns density.
- Availability: `in_stock` / `out_of_stock` aligned with catalog service.
- Shared polish tokens: reuse Hub CSS variables/classes; define a small local pattern set (section header, field group, modal frame) used by all three — not a new package.

## Left to the builder

- Exact section order/spacing in Settings and modal field grouping for readability.
- Whether Products edit is drawer vs split panel.
- Test plan: Products CRUD+image RTL; Settings smoke (render + save handlers still wired); Library card/modal responsive RTL/smoke.
- PR packaging (one frontend PR vs frontend + tiny backend image PR).

## Approval

Partner approved Approach 2 and this design (2026-11-14).
