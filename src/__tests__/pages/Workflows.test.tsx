/**
 * Tests for Workflows page component.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock all API calls to prevent actual requests
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: new Proxy(
    {},
    {
      get: () =>
        jest.fn().mockResolvedValue({ success: true, data: [] }),
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

import Workflows from '../../pages/Workflows';
import { AuthProvider } from '../../hooks/useAuth';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Workflows Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', async () => {
    await act(async () => {
      renderWithProviders(<Workflows />);
    });
  });

  it('mounts successfully', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(<Workflows />);
      container = rendered.container;
    });
    expect(container!).toBeInTheDocument();
  });
});

