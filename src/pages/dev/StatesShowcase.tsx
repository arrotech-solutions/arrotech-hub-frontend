import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  Input,
  TextArea,
  Select,
  FormField,
  Spinner,
  Skeleton,
  SkeletonGrid,
} from '../../components/ui';
import {
  EmptyState,
  LoadingState,
  ErrorState,
  SuccessState,
  PermissionDenied,
  OfflinePage,
} from '../../components/states';
import { notify } from '../../lib/notify';

/**
 * Dev-only visual QA surface for every UI state + snackbar variant.
 * Mounted at /dev/states in development builds only.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-secondary-200 p-6 dark:border-secondary-800">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-secondary-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StatesShowcase() {
  const [email, setEmail] = useState('');

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">
          UI States Showcase
        </h1>
        <p className="text-sm text-secondary-500">
          Every state component and snackbar variant for visual QA.
        </p>
      </header>

      <Section title="Snackbars (sonner via notify)">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => notify.success('Saved successfully')}>Success</Button>
          <Button variant="danger" onClick={() => notify.error('Could not save')}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => notify.warning('Heads up!')}>
            Warning
          </Button>
          <Button variant="outline" onClick={() => notify.info('Just so you know')}>
            Info
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              notify.success('Item deleted', {
                action: { label: 'Undo', onClick: () => notify.info('Restored') },
              })
            }
          >
            With action
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              notify.promise(new Promise((r) => setTimeout(r, 1500)), {
                loading: 'Saving…',
                success: 'All done!',
                error: 'Failed',
              })
            }
          >
            Promise
          </Button>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent (10%)</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>With icon</Button>
        </div>
      </Section>

      <Section title="Form field (validation)">
        <div className="max-w-sm space-y-4">
          <FormField label="Email" required hint="We’ll never share it.">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            )}
          </FormField>
          <FormField label="Broken field" error="This field is required">
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} />
            )}
          </FormField>
          <FormField label="Bio">
            {({ id }) => <TextArea id={id} placeholder="Tell us about yourself" />}
          </FormField>
          <FormField label="Role">
            {({ id }) => (
              <Select id={id}>
                <option>Owner</option>
                <option>Member</option>
              </Select>
            )}
          </FormField>
        </div>
      </Section>

      <Section title="Loading">
        <div className="grid gap-6 md:grid-cols-2">
          <LoadingState compact />
          <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton lines={3} />
          <SkeletonGrid count={3} />
        </div>
      </Section>

      <Section title="Empty & No results">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            compact
            action={{ label: 'Create item', onClick: () => notify.info('Create') }}
          />
          <EmptyState compact query="nonexistent term" />
        </div>
      </Section>

      <Section title="Error">
        <ErrorState compact onRetry={() => notify.info('Retrying…')} />
      </Section>

      <Section title="Success">
        <SuccessState
          title="Order placed!"
          description="We’ve emailed your receipt."
          action={{ label: 'View order', onClick: () => notify.info('View') }}
        />
      </Section>

      <Section title="Permission denied (inline)">
        <PermissionDenied inline />
      </Section>

      <Section title="Offline (page)">
        <OfflinePage onRetry={() => notify.info('Retry')} />
      </Section>
    </div>
  );
}
