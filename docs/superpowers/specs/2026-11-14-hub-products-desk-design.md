# Hub Products Desk — Design

**Date:** 2026-11-14  
**Status:** Approved — Products decisions carried into Hub polish ship  
**Superseded for planning by:** `2026-11-14-hub-polish-products-whatsapp-library-design.md`  
**Size:** Small change (short design; scope expanded to project polish wave)

## Intent and why

Kenya merchants need an industry-standard **Products** desk to run the live catalog day-to-day: find an item, change price/stock/photo/copy, add one product, stop selling without losing history. Catalog Builder remains bulk intake (photos/CSV). Database `catalog_products` and `/api/catalog/products` CRUD already exist — this is the Hub UI (plus any thin API gaps for image-on-edit).

## Goals

- Commerce → **Products** (`/catalog`): searchable, filterable table (thumb, name, price, stock/qty, availability).
- Row opens **full edit**: name, price, description, category, brand, SKU, quantity, availability, **photo replace**.
- **Add product** from this screen (single create with the same fields).
- **Unavailable / out of stock** is the primary “stop selling” action; WhatsApp rails already respect non-sellable availability.
- **Delete** secondary with confirm (mistakes/junk).
- Aesthetic, responsive (phone → desktop), matches existing Hub Commerce pages (Orders/Returns/Policy).
- Industry table UX: clear columns, search, empty state, loading/error, no dashboard soup.

## Non-goals

- New product database / replacing `catalog_products`.
- Variants, collections, multi-warehouse, barcode scanners.
- Replacing Catalog Builder.
- Reworking WhatsApp search beyond using updated catalog data.

## Anti-goals

- Price/stock-only screen that forces Builder for photos/description.
- Shipping a weak/unstashed WIP that doesn’t meet Commerce UI quality.
- Hard-delete as the only way to stop selling.

## Constraints

- Reuse existing catalog list/create/patch/delete (+ image storage used by Builder).
- Preserve Hub design system; ship on frontend branch that can PR to `develop` (extend `feat/whatsapp-ordering-commerce-rails-hub` or follow-up PR).
- Backend changes only if patch/create image upload from the desk needs a clearer multipart path.

## Approaches considered

| Approach | Summary | Tradeoff |
|----------|---------|----------|
| 1. Finish stashed Catalog inventory WIP | Recover local `/catalog` WIP | Fast if solid; quality/risk unknown |
| **2. Products desk on current Hub patterns (chosen)** | New page matching Orders/Returns quality on existing APIs | Slightly more work; industry-standard table |
| 3. Fold manage into Catalog Builder | One nav item | Wrong job for day-to-day ops |

**Chosen:** Approach 2 (partner confirmed; industry table standards required).

## Decided product behavior

| Topic | Decision |
|-------|----------|
| Home | Products table + search/filter |
| Edit | Full fields including photo |
| Create | Add one from Products; Builder for bulk |
| Stop selling | Mark unavailable / out of stock first |
| Delete | Confirm, secondary |
| Nav | Commerce → Products (alongside Catalog Builder) |

## Builder calls

- Prefer desktop table + mobile card/list pattern consistent with Returns/Orders.
- Availability values align with what catalog search/rails treat as unsellable (`out_of_stock` / equivalent already used by APIs).
- Image replace uses existing `store_catalog_image` path.

## Left to the builder

- Exact filter chips (All / In stock / Unavailable).
- Drawer vs full-page edit (pick what matches Hub density best).
- Thin backend tweak only if multipart image-on-PATCH is awkward from the SPA today.
- Tests: list/search, edit save, add, mark unavailable, delete confirm.

## Approval

Approve / request changes before the implementation plan or code.
