/**
 * Tests for ForgotPassword page component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock all API calls to prevent actual requests
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: new Proxy(
    {},
    {
      get: () =>
        jest.fn().mockResolvedValue({ success: true, data: {} }),
    }
  ),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

import ForgotPassword from '../../pages/ForgotPassword';
import { AuthProvider } from '../../hooks/useAuth';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    expect(() => renderWithProviders(<ForgotPassword />)).not.toThrow();
  });

  it('mounts successfully', () => {
    const { container } = renderWithProviders(<ForgotPassword />);
    expect(container).toBeInTheDocument();
  });

  it('has email input field', () => {
    renderWithProviders(<ForgotPassword />);
    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });
});
