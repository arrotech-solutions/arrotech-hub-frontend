# UI States & Feedback Doctrine

A production-ready, reusable system for the ten core UI states plus a branded
snackbar layer. Use these primitives instead of hand-rolling spinners, empty
blocks, red banners, or ad-hoc toasts.

## Brand palette (60 / 30 / 10)

| Share | Token | Name | Hex | Role |
| --- | --- | --- | --- | --- |
| **60%** | `secondary` (+ remapped `slate`/`gray`/`zinc`/`violet`) | Night Violet | `#1E1033` | Surfaces, chrome, text, canvas |
| **30%** | `primary` (+ remapped UI `blue`/`pink`/`indigo`/`sky`) | Dragon Fruit | `#FF4696` | Brand fills, active states, primary CTAs, toast info/loading |
| **10%** | `accent` (`amber`/`yellow`/`cyan`) | Solar Amber | `#FFC857` | Badges, slow-network banner, warning toasts, premium pops |

Also branded: browser `theme-color`, PWA manifest, scrollbars, mesh gradients, dark-mode `bg-white` overrides, cookie banner, session modal, chart hex colors, workflow canvas edges, and sonner toast left-border accents.

Utilities: `bg-brand-gradient`, `bg-accent-gradient`, `bg-surface-gradient`, `shadow-brand`, `shadow-accent`.

Because default Tailwind color names are remapped in `tailwind.config.js`, existing classnames across the app inherit the new feel.

- Feedback: `src/lib/notify.ts` (sonner-backed snackbars)
- Error mapping: `src/lib/mapApiError.ts`
- UI primitives: `src/components/ui/`
- State components: `src/components/states/`
- Network hooks: `src/hooks/useOnlineStatus.ts`, `src/hooks/useNetworkQuality.ts`
- Live showcase (dev only): route `/dev/states`

## How to respond to errors & success (decision guide)

| Situation | Use |
| --- | --- |
| Transient success (saved, copied, sent) | `notify.success(...)` |
| Recoverable/background error | `notify.error(...)` or `notify.fromError(err)` |
| Form **field** invalid | Inline `<FieldError>` / `<FormField>` — **never a toast** |
| A page **section** failed to load | `<ErrorState onRetry={...}/>` |
| Whole page unavailable | `<ErrorFallback/>` (crash), `<NotFound/>` (404), `<PermissionDenied/>` (403), `<OfflinePage/>` |
| Network condition | `<OfflineBanner/>`, `<SlowNetworkBanner/>` (already mounted in layouts) |
| Session/destructive | `<SessionExpiredModal/>` (auto), confirmation modal |
| Terminal / multi-step success | `<SuccessState/>` |

## Snackbars (`notify`)

```ts
import { notify } from '../lib/notify';

notify.success('Workflow saved');
notify.error('Could not save workflow');
notify.warning('You have unsaved changes');
notify.info('Syncing…');
notify.fromError(err, 'Could not load data'); // normalizes axios/API errors
notify.loading('Uploading…');                 // returns id
notify.promise(save(), { loading: 'Saving…', success: 'Saved!', error: 'Failed' });
notify.success('Deleted', { action: { label: 'Undo', onClick: restore } });
```

`notify` is the single source of truth. There is also a legacy `toast` export
(`import toast from '../lib/notify'`) that shims the old `react-hot-toast`
surface onto `notify` for already-migrated files — prefer `notify` in new code.

`react-hot-toast` has been removed. Do not reintroduce it.

## The ten states

1. **Empty** — `<EmptyState title description action />`
2. **Loading** — `<LoadingState/>` (section), `<PageLoader/>` (full page), `<Spinner/>`, `<Skeleton/>` / `<SkeletonGrid/>`
3. **Error** — `<ErrorState onRetry/>` (section), `<ErrorBoundary/>` + `<ErrorFallback/>` (crash)
4. **No internet** — `<OfflineBanner/>` (mounted in layouts), `<OfflinePage/>`
5. **Slow network** — `<SlowNetworkBanner/>` (mounted in layouts; fed by `useNetworkQuality` + axios timing events)
6. **No search results** — `<EmptyState query={term} />`
7. **Permission denied** — `<PermissionDenied/>` (403 page or `inline`), route guard `RequirePermission` in `App.tsx`
8. **Session expired** — `<SessionExpiredModal/>` (listens for `auth:session-expired` from the axios interceptor)
9. **Form validation** — `<FormField>` + `<FieldError>` + zod schemas in `src/lib/schemas.ts` via `zodResolver`
10. **Success** — `<SuccessState/>` for terminal screens; `notify.success` for transient

## Forms

```tsx
const { register, handleSubmit, formState: { errors } } =
  useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

<FormField label="Email" error={errors.email?.message} required>
  {({ id, describedBy, invalid }) => (
    <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register('email')} />
  )}
</FormField>
```

Field validation is always inline. Toasts are only for submit-level API results.

## App-wide wiring (already done)

- `App.tsx`: `<ErrorBoundary>` around routes, `<SessionExpiredModal/>`, `<NotFound/>` catch-all, `RequirePermission` guard, `PageLoader` for route/suspense fallbacks.
- `Layout.tsx` / `PublicLayout.tsx`: `<OfflineBanner/>` + `<SlowNetworkBanner/>`.
- `services/api.ts`: default timeout, request timing → `network:slow`/`network:normal` events, `auth:session-expired` on refresh failure, `auth:forbidden` on 403.
- `index.tsx`: branded sonner `<Toaster>` themed to Tailwind tokens + dark mode.

## Guardrails

`npm run lint:ui` (also runnable in CI) fails the build if it finds:

- an import from `react-hot-toast`, or
- the legacy full-page spinner idiom `rounded-full h-12 w-12 border-b-2`.

Use `notify` and the `states`/`ui` components instead.
