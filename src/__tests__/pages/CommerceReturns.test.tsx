/**
 * Returns queue: approving a request calls the returns approve API.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const pendingReturn = {
  id: 'ret-1',
  external_return_id: 'RET-1',
  order_external_id: 'ORD-1',
  customer_phone: '254712345678',
  reason_code: 'damaged',
  amount: '120.00',
  currency: 'KES',
  status: 'pending_approval',
  auto_approved: false,
  customer_message: 'Item arrived broken',
  refund_attempts: [],
  created_at: '2026-11-14T10:00:00.000Z',
  updated_at: '2026-11-14T10:00:00.000Z',
};

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    listCommerceReturns: jest.fn(),
    getCommerceReturn: jest.fn(),
    approveCommerceReturn: jest.fn(),
    denyCommerceReturn: jest.fn(),
    settleCommerceReturnOffline: jest.fn(),
  },
}));

jest.mock('../../lib/notify', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import apiService from '../../services/api';
import CommerceReturns from '../../pages/CommerceReturns';

const renderPage = () =>
  render(
    <MemoryRouter>
      <CommerceReturns />
    </MemoryRouter>
  );

describe('CommerceReturns page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.listCommerceReturns as jest.Mock).mockResolvedValue({
      success: true,
      data: { returns: [pendingReturn] },
    });
    (apiService.getCommerceReturn as jest.Mock).mockResolvedValue({
      success: true,
      data: pendingReturn,
    });
    (apiService.approveCommerceReturn as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        ...pendingReturn,
        status: 'refund_pending',
        customer_message: 'We approved the return. The payout is not complete yet.',
        refund_attempts: [
          { id: 'att-1', method: 'offline', status: 'pending', amount: '120.00', mpesa_receipt: null, error: null },
        ],
      },
    });
  });

  it('approves a return through the commerce returns API', async () => {
    const user = userEvent.setup();
    renderPage();

    const row = await screen.findByRole('button', { name: /ORD-1/i });
    await user.click(row);
    await user.click(screen.getByRole('button', { name: /approve return/i }));

    await waitFor(() => {
      expect(apiService.approveCommerceReturn).toHaveBeenCalledTimes(1);
    });
    expect(apiService.approveCommerceReturn).toHaveBeenCalledWith('ret-1');
  });

  it('links the customer to WhatsApp', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /ORD-1/i }));
    const link = screen.getByRole('link', { name: /whatsapp/i });
    expect(link).toHaveAttribute('href', 'https://wa.me/254712345678');
  });
});
