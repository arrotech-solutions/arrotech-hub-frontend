import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import organizationService from '../services/organizationService';
import { User, Organization } from '../types';

interface OrgSummary {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  hasPermission: (perm: string) => boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  verifyTOTP: (token: string, code: string) => Promise<any>;
  verifyBackupCode: (token: string, code: string) => Promise<any>;
  sendEmailOTP: (token: string) => Promise<any>;
  verifyEmailOTP: (token: string, code: string) => Promise<any>;
  loginWithGoogle: (credential: string) => Promise<any>;
  loginWithMicrosoft: (accessToken: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  // Email verification
  verifyEmail: (code: string) => Promise<any>;
  resendVerification: () => Promise<any>;
  // Organization context
  organizations: OrgSummary[];
  activeOrg: OrgSummary | null;
  switchOrg: (orgId: number | null) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrgSummary[]>([]);
  const [activeOrg, setActiveOrg] = useState<OrgSummary | null>(null);

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const refreshOrganizations = async () => {
    try {
      const response = await organizationService.list();
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Failed to refresh orgs:', error);
    }
  };

  const _handleAuthResponse = (responseData: any) => {
    localStorage.setItem('auth_token', responseData.token);
    if (responseData.refresh_token) {
      localStorage.setItem('refresh_token', responseData.refresh_token);
    }
    setUser(responseData.user);

    // Set organizations from auth response
    const orgs = responseData.organizations || [];
    setOrganizations(orgs);

    // Restore last active org
    const lastOrgId = localStorage.getItem('active_org_id');
    if (lastOrgId) {
      const org = orgs.find((o: OrgSummary) => o.id === Number(lastOrgId));
      if (org) setActiveOrg(org);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const rememberMeToken = localStorage.getItem('remember_me_token');

    if (token) {
      apiService.getCurrentUser()
        .then((response) => {
          setUser(response.data);
          // Also fetch orgs on initial load
          return organizationService.list();
        })
        .then((orgResponse) => {
          const orgs = orgResponse?.data || [];
          setOrganizations(orgs);
          const lastOrgId = localStorage.getItem('active_org_id');
          if (lastOrgId) {
            const org = orgs.find((o: OrgSummary) => o.id === Number(lastOrgId));
            if (org) setActiveOrg(org);
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('remember_me_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (rememberMeToken) {
      localStorage.removeItem('remember_me_token');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await apiService.login(email, password, rememberMe);

      // Handle 2FA Challenge
      // apiService.login() returns axiosResponse.data, so `response` IS the JSON body
      if (response.requires_2fa) {
        return { requires_2fa: true, data: response.data };
      }

      _handleAuthResponse(response.data);

      if (response.data.remember_me_token) {
        localStorage.setItem('remember_me_token', response.data.remember_me_token);
      }

      toast.success('Login successful!');
      return {
        requires_2fa: false,
        user: response.data.user,
        organizations: response.data.organizations || [],
        is_new_user: response.data.is_new_user || false,
      };
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  const verifyTOTP = async (two_factor_token: string, code: string) => {
    try {
      const response = await apiService.request({
        method: 'POST',
        url: '/auth/login/2fa/totp',
        data: { two_factor_token, code }
      });

      _handleAuthResponse(response.data.data);
      toast.success('Login successful!');
      return response.data.data.user;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid code');
      throw error;
    }
  };

  const verifyBackupCode = async (two_factor_token: string, code: string) => {
    try {
      const response = await apiService.request({
        method: 'POST',
        url: '/auth/login/2fa/backup',
        data: { two_factor_token, code }
      });

      _handleAuthResponse(response.data.data);
      toast.success('Login successful!');
      return response.data.data.user;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid backup code');
      throw error;
    }
  };

  const sendEmailOTP = async (two_factor_token: string) => {
    try {
      const response = await apiService.request({
        method: 'POST',
        url: '/auth/login/2fa/email/send',
        data: { two_factor_token }
      });

      toast.success(response.data.message || 'Verification code sent!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send code');
      throw error;
    }
  };

  const verifyEmailOTP = async (two_factor_token: string, code: string) => {
    try {
      const response = await apiService.request({
        method: 'POST',
        url: '/auth/login/2fa/email/verify',
        data: { two_factor_token, code }
      });

      _handleAuthResponse(response.data.data);
      toast.success('Login successful!');
      return response.data.data.user;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid code');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiService.register(email, password, name);
      _handleAuthResponse(response.data);
      toast.success('Registration successful! Please verify your email.');
      return {
        is_new_user: response.data.is_new_user ?? true,
        email_verified: response.data.user?.email_verified ?? false,
      };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      const response = await apiService.request({
        method: 'POST',
        url: '/auth/verify-email',
        data: { code },
      });
      // Refresh user to get updated email_verified status
      await refreshUser();
      toast.success('Email verified successfully!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Verification failed');
      throw error;
    }
  };

  const resendVerification = async () => {
    try {
      const response = await apiService.request({
        method: 'POST',
        url: '/auth/resend-verification',
      });
      toast.success(response.data.message || 'Verification code sent!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to resend code');
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await apiService.googleAuth(credential);
      _handleAuthResponse(response.data);
      toast.success('Login successful!');
      return {
        user: response.data.user,
        is_new_user: response.data.is_new_user || false,
        organizations: response.data.organizations || [],
      };
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Google login failed');
      throw error;
    }
  };

  const loginWithMicrosoft = async (accessToken: string) => {
    try {
      const response = await apiService.microsoftAuth(accessToken);
      _handleAuthResponse(response.data);
      toast.success('Login successful!');
      return {
        user: response.data.user,
        is_new_user: response.data.is_new_user || false,
        organizations: response.data.organizations || [],
      };
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Microsoft login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setOrganizations([]);
      setActiveOrg(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('remember_me_token');
      localStorage.removeItem('active_org_id');
      toast.success('Logged out successfully');
    }
  };

  const switchOrg = async (orgId: number | null) => {
    try {
      const response = await organizationService.switchOrg(orgId);
      localStorage.setItem('auth_token', response.data.token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      if (orgId !== null) {
        localStorage.setItem('active_org_id', String(orgId));
        const org = organizations.find(o => o.id === orgId) || null;
        setActiveOrg(org);
      } else {
        localStorage.removeItem('active_org_id');
        setActiveOrg(null);
      }
      toast.success(orgId ? 'Switched organization' : 'Switched to personal context');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to switch organization');
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await apiService.updateUser(data);
      setUser(response.data);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await apiService.forgotPassword(email);
      toast.success('Password reset email sent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await apiService.resetPassword(token, newPassword);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset failed');
      throw error;
    }
  };

  const validateResetToken = async (token: string) => {
    try {
      await apiService.validateResetToken(token);
      toast.success('Password reset token is valid!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset token is invalid');
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password change failed');
      throw error;
    }
  };

  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee' || user?.role === 'admin';
  const hasPermission = (perm: string): boolean => {
    if (user?.role === 'admin') return true;
    return !!(user?.permissions && user.permissions[perm]);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    isEmployee,
    hasPermission,
    login,
    verifyTOTP,
    verifyBackupCode,
    sendEmailOTP,
    verifyEmailOTP,
    loginWithGoogle,
    loginWithMicrosoft,
    register,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
    validateResetToken,
    changePassword,
    refreshUser,
    verifyEmail,
    resendVerification,
    organizations,
    activeOrg,
    switchOrg,
    refreshOrganizations,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};