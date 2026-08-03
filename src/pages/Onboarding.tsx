import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  User,
  Mail,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import organizationService from '../services/organizationService';
import toast from '../lib/notify';
import type { OnboardingPrimaryGoal } from '../types';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { ChoiceTile, SelectChip } from '../components/onboarding/ChoiceTile';
import AppConnectRow from '../components/onboarding/AppConnectRow';
import {
  ONBOARDING_GOALS,
  GOAL_RECOMMENDED_APPS,
  GOAL_LANDING,
  GOAL_FIRST_WIN,
  ONBOARDING_VERSION,
} from '../components/onboarding/onboardingConfig';
import {
  consumeOnboardingResume,
  startPlatformOAuth,
} from '../components/onboarding/connectHelpers';

type WizardStep =
  | 'welcome'
  | 'primary'
  | 'secondary'
  | 'context'
  | 'org'
  | 'apps'
  | 'first_win'
  | 'done';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
  'E-commerce', 'Manufacturing', 'Real Estate', 'Consulting', 'Other',
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const STEP_ORDER_BASE: WizardStep[] = [
  'welcome',
  'primary',
  'secondary',
  'context',
  'org',
  'apps',
  'first_win',
  'done',
];

const fieldClass =
  'w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white text-sm outline-none transition-colors placeholder:text-secondary-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/25';

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser, refreshOrganizations, switchOrg, activeOrg } = useAuth();

  // Grandfathered / already-finished users: don't re-run the wizard unless ?redo=1
  useEffect(() => {
    if (user?.onboarding_completed_at && searchParams.get('redo') !== '1') {
      navigate('/unified', { replace: true });
    }
  }, [user?.onboarding_completed_at, searchParams, navigate]);

  const [step, setStep] = useState<WizardStep>('welcome');
  const [primaryGoal, setPrimaryGoal] = useState<OnboardingPrimaryGoal | null>(null);
  const [secondaryGoals, setSecondaryGoals] = useState<OnboardingPrimaryGoal[]>([]);
  const [workspaceType, setWorkspaceType] = useState<'solo' | 'team' | null>(null);
  const [saving, setSaving] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  const [orgForm, setOrgForm] = useState({
    name: '',
    industry: '',
    company_size: '',
  });
  const [inviteEmails, setInviteEmails] = useState('');

  const steps = useMemo(() => {
    if (workspaceType === 'team') return STEP_ORDER_BASE;
    return STEP_ORDER_BASE.filter((s) => s !== 'org');
  }, [workspaceType]);

  const stepIndex = Math.max(0, steps.indexOf(step));
  const firstName = user?.name?.split(' ')[0] || 'there';

  const syncProgress = useCallback(
    async (payload: Parameters<typeof apiService.updateOnboarding>[0]) => {
      try {
        await apiService.updateOnboarding(payload);
        await refreshUser();
      } catch (err) {
        console.error('Failed to sync onboarding', err);
      }
    },
    [refreshUser]
  );

  const loadConnections = useCallback(async () => {
    try {
      const res = await apiService.getConnections();
      const list = res.data || [];
      setConnectedPlatforms(list.map((c: any) => c.platform));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (user?.primary_goal) setPrimaryGoal(user.primary_goal);
    if (user?.secondary_goals?.length) setSecondaryGoals(user.secondary_goals);
    if (user?.workspace_type) setWorkspaceType(user.workspace_type);

    const resume =
      consumeOnboardingResume() ??
      (searchParams.get('step') ? parseInt(searchParams.get('step')!, 10) : null);

    if (resume != null && Number.isFinite(resume)) {
      const ordered =
        (user?.workspace_type === 'team' ? STEP_ORDER_BASE : STEP_ORDER_BASE.filter((s) => s !== 'org'));
      const target = ordered[Math.min(Math.max(resume, 0), ordered.length - 1)];
      if (target && target !== 'done') setStep(target);
    } else if (user?.onboarding_step != null && user.onboarding_step > 0) {
      const ordered =
        user.workspace_type === 'team'
          ? STEP_ORDER_BASE
          : STEP_ORDER_BASE.filter((s) => s !== 'org');
      const target = ordered[Math.min(user.onboarding_step, ordered.length - 2)];
      if (target) setStep(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 'apps') loadConnections();
  }, [step, loadConnections]);

  const goTo = (next: WizardStep) => {
    setStep(next);
    const idx = steps.indexOf(next);
    if (idx >= 0) {
      void syncProgress({ onboarding_step: idx, onboarding_version: ONBOARDING_VERSION });
    }
  };

  const goBack = () => {
    const idx = steps.indexOf(step);
    if (idx <= 0) return;
    setStep(steps[idx - 1]);
  };

  const toggleSecondary = (id: OnboardingPrimaryGoal) => {
    setSecondaryGoals((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const completeAndLand = async (activation?: string) => {
    setSaving(true);
    try {
      const goal = primaryGoal || 'exploring';
      await apiService.updateOnboarding({
        primary_goal: goal,
        secondary_goals: secondaryGoals,
        workspace_type: workspaceType || 'solo',
        preferred_apps: connectedPlatforms,
        activation_event: activation || GOAL_FIRST_WIN[goal].activation,
        onboarding_step: steps.length - 1,
        onboarding_version: ONBOARDING_VERSION,
        complete: true,
      });
      try {
        localStorage.setItem('hub_skip_auto_tutorial', '1');
      } catch {
        /* ignore */
      }
      await refreshUser();
      setStep('done');
      const landing = GOAL_LANDING[goal];
      setTimeout(() => navigate(landing, { replace: true }), 1100);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not finish setup');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!orgForm.name.trim()) {
      toast.error('Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const response = await organizationService.create({
        name: orgForm.name.trim(),
        industry: orgForm.industry || undefined,
        company_size: orgForm.company_size || undefined,
      });
      await refreshOrganizations();
      await switchOrg(response.data.id);
      const emails = inviteEmails
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter((e) => e.includes('@'));
      for (const email of emails.slice(0, 5)) {
        try {
          await organizationService.createInvitation(response.data.id, email, 'member');
        } catch {
          /* non-blocking */
        }
      }
      toast.success('Organization ready');
      goTo('apps');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (platformId: string) => {
    setConnectingId(platformId);
    const appsStepIndex = steps.indexOf('apps');
    await startPlatformOAuth(platformId, appsStepIndex >= 0 ? appsStepIndex : 5);
    setConnectingId(null);
  };

  const recommended = primaryGoal ? GOAL_RECOMMENDED_APPS[primaryGoal] : [];
  const firstWin = primaryGoal ? GOAL_FIRST_WIN[primaryGoal] : GOAL_FIRST_WIN.exploring;

  if (user?.onboarding_completed_at && searchParams.get('redo') !== '1') {
    return null;
  }

  if (step === 'welcome') {
    return (
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={steps.length}
        brandFirst
        title={`Hey ${firstName}, let’s set up Hub for how you work`}
        subtitle="A short wizard so we route you to the right inbox, agents, or AI — about 3 minutes."
        onContinue={() => goTo('primary')}
        continueLabel="Get started"
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white">Personalized from the start</p>
            <p className="text-sm text-secondary-400 mt-1 leading-relaxed">
              Tell us your goal, connect a couple of apps, and land where you’ll get value first.
              You can change this anytime.
            </p>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  if (step === 'primary') {
    return (
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={steps.length}
        title="What do you want to do with Hub?"
        subtitle="Pick the main reason you signed up. We’ll tailor setup around this."
        onBack={goBack}
        onContinue={() => {
          if (!primaryGoal) return;
          void syncProgress({ primary_goal: primaryGoal, onboarding_step: stepIndex });
          goTo('secondary');
        }}
        continueDisabled={!primaryGoal}
      >
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          role="radiogroup"
          aria-label="Primary goal"
        >
          {ONBOARDING_GOALS.map((goal) => (
            <ChoiceTile
              key={goal.id}
              title={goal.title}
              description={goal.description}
              icon={goal.icon}
              accent={goal.accent}
              selected={primaryGoal === goal.id}
              onSelect={() => setPrimaryGoal(goal.id)}
            />
          ))}
        </div>
      </OnboardingShell>
    );
  }

  if (step === 'secondary') {
    return (
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={steps.length}
        title="Anything else you’re curious about?"
        subtitle="Optional — pick up to two. We’ll add them to your getting-started checklist."
        onBack={goBack}
        onContinue={() => {
          void syncProgress({ secondary_goals: secondaryGoals, onboarding_step: stepIndex });
          goTo('context');
        }}
        secondaryAction={{
          label: 'Skip for now',
          onClick: () => {
            setSecondaryGoals([]);
            goTo('context');
          },
        }}
      >
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_GOALS.filter((g) => g.id !== primaryGoal).map((goal) => (
            <SelectChip
              key={goal.id}
              label={goal.title}
              selected={secondaryGoals.includes(goal.id)}
              disabled={!secondaryGoals.includes(goal.id) && secondaryGoals.length >= 2}
              onToggle={() => toggleSecondary(goal.id)}
            />
          ))}
        </div>
      </OnboardingShell>
    );
  }

  if (step === 'context') {
    return (
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={steps.length}
        title="Who are you setting this up for?"
        subtitle="Solo keeps things personal. Team creates an organization you can invite people to."
        onBack={goBack}
        onContinue={() => {
          if (!workspaceType) return;
          void syncProgress({ workspace_type: workspaceType, onboarding_step: stepIndex });
          if (workspaceType === 'team') {
            if (activeOrg) goTo('apps');
            else goTo('org');
          } else {
            goTo('apps');
          }
        }}
        continueDisabled={!workspaceType}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <ChoiceTile
            title="Just me"
            description="Personal workspace for your own inbox, agents, and automations."
            icon={User}
            selected={workspaceType === 'solo'}
            onSelect={() => setWorkspaceType('solo')}
            accent="from-primary-500 to-primary-600"
          />
          <ChoiceTile
            title="My team"
            description="Create an organization, invite teammates, and share context."
            icon={Building2}
            selected={workspaceType === 'team'}
            onSelect={() => setWorkspaceType('team')}
            accent="from-accent-400 to-primary-500"
          />
        </div>
        {activeOrg && workspaceType === 'team' && (
          <p className="mt-4 text-sm text-secondary-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            You’re already in <span className="text-white font-medium">{activeOrg.name}</span> — we’ll skip org creation.
          </p>
        )}
      </OnboardingShell>
    );
  }

  if (step === 'org') {
    return (
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={steps.length}
        title="Create your organization"
        subtitle="Name is enough to start. You can invite people now or later."
        onBack={goBack}
        onContinue={handleCreateOrg}
        continueLabel="Create & continue"
        continueLoading={saving}
        continueDisabled={!orgForm.name.trim()}
        secondaryAction={{
          label: 'Skip invites for now',
          onClick: handleCreateOrg,
        }}
      >
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-secondary-300 text-sm font-medium mb-1.5">
              Organization name
            </label>
            <input
              className={fieldClass}
              value={orgForm.name}
              onChange={(e) => setOrgForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Acme Ltd"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-secondary-300 text-sm font-medium mb-1.5">
              Industry <span className="text-secondary-500">(optional)</span>
            </label>
            <select
              className={fieldClass}
              value={orgForm.industry}
              onChange={(e) => setOrgForm((p) => ({ ...p, industry: e.target.value }))}
            >
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i} className="bg-secondary-900">
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-secondary-300 text-sm font-medium mb-1.5">
              Company size <span className="text-secondary-500">(optional)</span>
            </label>
            <select
              className={fieldClass}
              value={orgForm.company_size}
              onChange={(e) => setOrgForm((p) => ({ ...p, company_size: e.target.value }))}
            >
              <option value="">Select…</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s} className="bg-secondary-900">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-secondary-300 text-sm font-medium mb-1.5 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite teammates <span className="text-secondary-500">(optional)</span>
            </label>
            <input
              className={fieldClass}
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="alex@company.com, sam@company.com"
            />
          </div>
        </div>
      </OnboardingShell>
    );
  }

  if (step === 'apps') {
    return (
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={steps.length}
        title="Connect the apps that matter"
        subtitle="Recommended for your goal. Connect at least one if you can — or skip and do it later."
        onBack={goBack}
        onContinue={() => {
          void syncProgress({
            preferred_apps: connectedPlatforms,
            onboarding_step: stepIndex,
          });
          goTo('first_win');
        }}
        continueLabel={
          connectedPlatforms.some((p) => recommended.some((r) => r.id === p))
            ? 'Continue'
            : 'Continue without connecting'
        }
        secondaryAction={{
          label: 'I’ll do this later',
          onClick: () => goTo('first_win'),
        }}
      >
        <div className="space-y-3">
          {recommended.map((app) => (
            <AppConnectRow
              key={app.id}
              name={app.name}
              hint={app.hint}
              connected={connectedPlatforms.includes(app.id)}
              connecting={connectingId === app.id}
              onConnect={() => handleConnect(app.id)}
            />
          ))}
        </div>
      </OnboardingShell>
    );
  }

  if (step === 'first_win') {
    return (
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={steps.length}
        title={firstWin.title}
        subtitle={firstWin.description}
        onBack={goBack}
        onContinue={() => completeAndLand(firstWin.activation)}
        continueLabel={firstWin.cta}
        continueLoading={saving}
      >
        <div className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-white/5 p-6 sm:p-8">
          <p className="text-sm text-secondary-300 leading-relaxed">
            After this, you’ll land in the right place with a short checklist tailored to{' '}
            <span className="text-white font-medium">
              {ONBOARDING_GOALS.find((g) => g.id === primaryGoal)?.title || 'your goal'}
            </span>
            .
          </p>
        </div>
      </OnboardingShell>
    );
  }

  // done
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-surface-gradient-dark px-4">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">You’re all set</h1>
        <p className="text-secondary-400 mt-2 text-sm">Taking you to your workspace…</p>
      </div>
    </div>
  );
};

export default OnboardingWizard;
