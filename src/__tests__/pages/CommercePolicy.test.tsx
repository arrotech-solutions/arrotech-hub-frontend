/**
 * Commerce policy editor: save sends the merchant policy update (PUT client).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const policy = {
  sell_modes: ['retail', 'food'],
  delivery_methods: ['delivery', 'pickup'],
  reservations_enabled: false,
  business_hours: {},
  away_message: '',
  return_window_days: 7,
  return_reason_codes: ['damaged', 'wrong_item', 'not_as_described', 'changed_mind'],
  auto_approve_enabled: false,
  auto_approve_max_amount_kes: 0,
  cancel_until_status: 'preparing',
  human_handoff_ttl_hours: 24,
  commerce_rails_enabled: true,
};

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getCommercePolicy: jest.fn(),
    updateCommercePolicy: jest.fn(),
    getWhatsAppBusinessProfile: jest.fn(),
  },
}));

jest.mock('../../lib/notify', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import apiService from '../../services/api';
import CommercePolicy from '../../pages/CommercePolicy';

const renderPage = () =>
  render(
    <MemoryRouter>
      <CommercePolicy />
    </MemoryRouter>
  );

describe('CommercePolicy page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getCommercePolicy as jest.Mock).mockResolvedValue({
      success: true,
      data: policy,
    });
    (apiService.updateCommercePolicy as jest.Mock).mockImplementation(async (body) => ({
      success: true,
      data: { ...policy, ...body },
    }));
    (apiService.getWhatsAppBusinessProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { business_hours: {}, away_message: '' },
    });
  });

  it('saves policy through the commerce policy update API', async () => {
    const user = userEvent.setup();
    renderPage();

    const windowField = await screen.findByLabelText(/return window/i);
    expect(windowField).toHaveValue(7);

    await user.clear(windowField);
    await user.type(windowField, '14');
    await user.click(screen.getByRole('button', { name: /save policy/i }));

    await waitFor(() => {
      expect(apiService.updateCommercePolicy).toHaveBeenCalledTimes(1);
    });
    expect(apiService.updateCommercePolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        return_window_days: 14,
        sell_modes: expect.arrayContaining(['retail', 'food']),
        commerce_rails_enabled: true,
      })
    );
  });
});
