/**
 * Tests for NotificationsDropdown component.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock the API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getNotifications: jest.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
    getUnreadNotificationCount: jest.fn().mockResolvedValue({
      success: true,
      data: { unread_count: 3 },
    }),
    markNotificationAsRead: jest.fn().mockResolvedValue({ success: true }),
    markAllNotificationsAsRead: jest.fn().mockResolvedValue({ success: true }),
    deleteNotification: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

import NotificationsDropdown from '../../components/NotificationsDropdown';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('NotificationsDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders bell icon button', () => {
    renderWithRouter(<NotificationsDropdown />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    renderWithRouter(<NotificationsDropdown />);
    const user = userEvent.setup();

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    renderWithRouter(<NotificationsDropdown />);
    const user = userEvent.setup();

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });
});

