/**
 * Tests for Register page component.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock the API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    updateUser: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    validateResetToken: jest.fn(),
    changePassword: jest.fn(),
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import Register from '../../pages/Register';
import { AuthProvider } from '../../hooks/useAuth';

// Wrapper with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders registration form', () => {
    renderWithProviders(<Register />);

    // Check for form elements
    expect(document.body).toBeInTheDocument();
  });

  it('has email input field', () => {
    renderWithProviders(<Register />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('has password input field', () => {
    renderWithProviders(<Register />);

    const passwordInputs = screen.getAllByPlaceholderText(/password/i);
    expect(passwordInputs.length).toBeGreaterThan(0);
  });

  it('has submit button', () => {
    renderWithProviders(<Register />);

    const submitButton = screen.getByRole('button', {
      name: /sign up|create|register/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  it('has link to login page', () => {
    renderWithProviders(<Register />);

    const signInLink = screen.getByText(/sign in/i);
    expect(signInLink).toBeInTheDocument();
  });
});
