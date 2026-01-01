/**
 * Tests for Dashboard page component.
 */
import React from 'react';
import { render } from '@testing-library/react';
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

import Dashboard from '../../pages/Dashboard';
import { AuthProvider } from '../../hooks/useAuth';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', () => {
    expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
  });

  it('mounts successfully', () => {
    const { container } = renderWithProviders(<Dashboard />);
    expect(container).toBeInTheDocument();
  });
});
