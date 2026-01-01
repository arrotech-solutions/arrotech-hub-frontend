/**
 * Tests for Marketplace page component.
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
        jest.fn().mockResolvedValue({
          success: true,
          data: { workflows: [], total: 0 },
        }),
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

import Marketplace from '../../pages/Marketplace';
import { AuthProvider } from '../../hooks/useAuth';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Marketplace Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', () => {
    expect(() => renderWithProviders(<Marketplace />)).not.toThrow();
  });

  it('mounts successfully', () => {
    const { container } = renderWithProviders(<Marketplace />);
    expect(container).toBeInTheDocument();
  });
});
