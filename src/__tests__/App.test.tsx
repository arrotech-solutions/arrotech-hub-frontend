/**
 * Tests for App component.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock all API calls to prevent actual requests
jest.mock('../services/api', () => ({
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
  Toaster: () => null,
}));

import App from '../App';

// App requires BrowserRouter from index.tsx
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = renderApp();
    expect(container).toBeInTheDocument();
  });

  it('mounts successfully', () => {
    const { container } = renderApp();
    expect(container.firstChild).toBeTruthy();
  });
});
