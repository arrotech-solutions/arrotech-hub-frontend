import apiService from '../../services/api';
import toast from '../../lib/notify';
import { ONBOARDING_RESUME_KEY } from './onboardingConfig';

type AuthUrlFn = () => Promise<{ auth_url: string; state?: string } | any>;

const AUTH_URL_BY_PLATFORM: Record<string, AuthUrlFn> = {
  google_workspace: () => apiService.getGoogleWorkspaceAuthUrl(),
  outlook: () => apiService.getOutlookAuthUrl(),
  slack: () => apiService.getSlackAuthUrl(),
  teams: () => apiService.getTeamsAuthUrl(),
  whatsapp: () => apiService.getWhatsAppAuthUrl(),
  telegram: () => apiService.getTelegramAuthUrl(),
  instagram: () => apiService.getInstagramAuthUrl(),
  facebook: () => apiService.getFacebookAuthUrl(),
  tiktok: () => apiService.getTikTokAuthUrl(),
  linkedin: () => apiService.getLinkedInAuthUrl(),
  hubspot: () => apiService.getHubSpotAuthUrl(),
};

function writeResume(step: number) {
  const value = String(step);
  try {
    sessionStorage.setItem(ONBOARDING_RESUME_KEY, value);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(ONBOARDING_RESUME_KEY, value);
  } catch {
    /* ignore */
  }
}

function readResume(consume: boolean): number | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(ONBOARDING_RESUME_KEY);
  } catch {
    /* ignore */
  }
  if (raw == null) {
    try {
      raw = localStorage.getItem(ONBOARDING_RESUME_KEY);
    } catch {
      /* ignore */
    }
  }
  if (consume) {
    try {
      sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(ONBOARDING_RESUME_KEY);
    } catch {
      /* ignore */
    }
  }
  if (!raw) return null;
  const step = parseInt(raw, 10);
  return Number.isFinite(step) ? step : null;
}

export function markOnboardingResume(step: number) {
  writeResume(step);
}

export function consumeOnboardingResume(): number | null {
  return readResume(true);
}

export function peekOnboardingResume(): number | null {
  return readResume(false);
}

/** After an OAuth round-trip, send the user back into the wizard when applicable. */
export function onboardingResumePath(): string | null {
  const step = peekOnboardingResume();
  if (step == null) return null;
  return `/onboarding?step=${step}`;
}

export async function startPlatformOAuth(platformId: string, resumeStep: number) {
  // Telegram uses BotFather token entry on Connections (not OAuth / Login Widget)
  if (platformId === 'telegram') {
    markOnboardingResume(resumeStep);
    window.location.href = '/connections?connect=telegram';
    return;
  }

  const fn = AUTH_URL_BY_PLATFORM[platformId];
  if (!fn) {
    toast.error('This connection isn’t available from onboarding yet. You can connect it later.');
    return;
  }
  try {
    toast.loading('Redirecting…', { id: 'onboarding-oauth' });
    markOnboardingResume(resumeStep);
    const result = await fn();
    const authUrl =
      result?.auth_url ||
      result?.url ||
      result?.data?.auth_url ||
      result?.data?.url;
    if (!authUrl) {
      throw new Error('No auth URL returned');
    }
    window.location.href = authUrl;
  } catch (error: any) {
    toast.dismiss('onboarding-oauth');
    if (error?.response?.status === 402) {
      toast.error('Upgrade required to connect this app. You can skip and continue.');
      return;
    }
    toast.error(error?.response?.data?.detail || 'Failed to start connection');
  }
}
