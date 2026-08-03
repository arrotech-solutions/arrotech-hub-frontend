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

export function markOnboardingResume(step: number) {
  try {
    sessionStorage.setItem(ONBOARDING_RESUME_KEY, String(step));
  } catch {
    /* ignore */
  }
}

export function consumeOnboardingResume(): number | null {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_RESUME_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
    const step = parseInt(raw, 10);
    return Number.isFinite(step) ? step : null;
  } catch {
    return null;
  }
}

export function peekOnboardingResume(): number | null {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_RESUME_KEY);
    if (!raw) return null;
    const step = parseInt(raw, 10);
    return Number.isFinite(step) ? step : null;
  } catch {
    return null;
  }
}

export async function startPlatformOAuth(platformId: string, resumeStep: number) {
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
