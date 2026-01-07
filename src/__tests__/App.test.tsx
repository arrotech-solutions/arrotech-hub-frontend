/**
 * Tests for App component.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
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

  it('renders without crashing', async () => {
    await act(async () => {
      renderApp();
    });
  });

  it('mounts successfully', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderApp();
      container = rendered.container;
    });
    expect(container!.firstChild).toBeTruthy();
  });
});
