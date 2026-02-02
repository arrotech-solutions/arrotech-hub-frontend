import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithMicrosoft: (accessToken: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const rememberMeToken = localStorage.getItem('remember_me_token');

    if (token) {
      apiService.getCurrentUser()
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('remember_me_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (rememberMeToken) {
      // Try to use remember me token to get user info
      // This would require a new endpoint to validate remember me token
      // For now, we'll just clear the token
      localStorage.removeItem('remember_me_token');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await apiService.login(email, password, rememberMe);
      localStorage.setItem('auth_token', response.data.token);

      if (response.data.remember_me_token) {
        localStorage.setItem('remember_me_token', response.data.remember_me_token);
      }

      setUser(response.data.user);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiService.register(email, password, name);
      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      toast.success('Registration successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await apiService.googleAuth(credential);
      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Google login failed');
      throw error;
    }
  };

  const loginWithMicrosoft = async (accessToken: string) => {
    try {
      const response = await apiService.microsoftAuth(accessToken);
      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      toast.success('Login successful!');
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('remember_me_token');
      toast.success('Logged out successfully');
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

  const value: AuthContextType = {
    user,
    loading,
    login,
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};