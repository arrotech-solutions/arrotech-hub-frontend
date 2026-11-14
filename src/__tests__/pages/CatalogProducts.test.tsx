/**
 * Products desk: list, search, and stock filters.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const maize = {
  id: 'prod-1',
  name: 'Maize flour',
  price: '180.00',
  quantity: '24',
  availability: 'in_stock',
  image_url: 'https://cdn.example/maize.jpg',
};

const oil = {
  id: 'prod-2',
  name: 'Cooking oil',
  price: '320.00',
  quantity: '3',
  availability: 'out_of_stock',
  image_url: '',
};

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    listCatalogProducts: jest.fn(),
    createCatalogProduct: jest.fn(),
  },
}));

jest.mock('../../lib/notify', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import apiService from '../../services/api';
import toast from '../../lib/notify';
import CatalogProducts from '../../pages/CatalogProducts';

const renderPage = () =>
  render(
    <MemoryRouter>
      <CatalogProducts />
    </MemoryRouter>
  );

describe('CatalogProducts page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.listCatalogProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: [maize] },
    });
  });

  it('loads the catalog through listCatalogProducts', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument();
    expect((await screen.findAllByText('Maize flour')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/180\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('24').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/in stock/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('img', { name: 'Maize flour' }).length).toBeGreaterThan(0);
    expect(apiService.listCatalogProducts).toHaveBeenCalled();
  });

  it('shows an empty state and an add action when there are no products', async () => {
    (apiService.listCatalogProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: [] },
    });
    renderPage();

    expect(await screen.findByText(/no products yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  });

  it('calls listCatalogProducts with the typed search query', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'flour');

    await waitFor(() => {
      expect(apiService.listCatalogProducts).toHaveBeenCalledWith({ q: 'flour' });
    });
  });

  it('filters availability on the client', async () => {
    const user = userEvent.setup();
    (apiService.listCatalogProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: [maize, oil] },
    });
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.click(screen.getByRole('button', { name: /^out of stock$/i }));

    expect(screen.queryAllByText('Maize flour')).toHaveLength(0);
    expect(screen.getAllByText('Cooking oil').length).toBeGreaterThan(0);
  });

  it('toasts a mapped error when the catalog fails to load', async () => {
    (apiService.listCatalogProducts as jest.Mock).mockRejectedValue(new Error('catalog down'));
    renderPage();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('catalog down');
    });
  });

  it('shows an error state instead of an empty catalog when the list fails', async () => {
    (apiService.listCatalogProducts as jest.Mock).mockRejectedValue(new Error('catalog down'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/catalog down/i);
    expect(screen.queryByText(/no products yet/i)).not.toBeInTheDocument();
  });

  it('drops the previous rows when a search fails', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Maize flour');

    (apiService.listCatalogProducts as jest.Mock).mockRejectedValue(new Error('search failed'));
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'flour');

    expect(await screen.findByRole('alert')).toHaveTextContent(/search failed/i);
    expect(screen.queryAllByText('Maize flour')).toHaveLength(0);
    expect(screen.queryByText(/no products yet/i)).not.toBeInTheDocument();
  });

  it('shows a loading state while the catalog request is in flight', () => {
    (apiService.listCatalogProducts as jest.Mock).mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
