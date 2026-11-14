/**
 * Products desk: list, search, stock filters, and product writes.
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
    updateCatalogProduct: jest.fn(),
    deleteCatalogProduct: jest.fn(),
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

  it('creates a product from the add panel', async () => {
    const user = userEvent.setup();
    (apiService.createCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'prod-new', name: 'Sugar', price: '120.00', availability: 'in_stock' },
    });
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await user.type(screen.getByRole('textbox', { name: /^name$/i }), 'Sugar');
    await user.type(screen.getByRole('textbox', { name: /^price$/i }), '120');
    await user.type(screen.getByRole('textbox', { name: /^description$/i }), 'White sugar');
    await user.type(screen.getByRole('textbox', { name: /^category$/i }), 'Staples');
    await user.type(screen.getByRole('textbox', { name: /^brand$/i }), 'Mumias');
    await user.type(screen.getByRole('textbox', { name: /^sku$/i }), 'SUG-1');
    await user.type(screen.getByRole('textbox', { name: /^quantity$/i }), '5');
    await user.selectOptions(screen.getByRole('combobox', { name: /^availability$/i }), 'in_stock');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(apiService.createCatalogProduct).toHaveBeenCalledWith({
        name: 'Sugar',
        price: '120',
        description: 'White sugar',
        category: 'Staples',
        brand: 'Mumias',
        sku: 'SUG-1',
        quantity: '5',
        availability: 'in_stock',
      });
    });
  });

  it('saves an edited product through updateCatalogProduct', async () => {
    const user = userEvent.setup();
    (apiService.updateCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...maize, price: '200' },
    });
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.click(screen.getAllByRole('button', { name: /edit maize flour/i })[0]);
    const price = screen.getByRole('textbox', { name: /^price$/i });
    await user.clear(price);
    await user.type(price, '200');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(apiService.updateCatalogProduct).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({
          name: 'Maize flour',
          price: '200',
          availability: 'in_stock',
        })
      );
    });
  });

  it('previews a chosen photo locally and sends base64 on save', async () => {
    const user = userEvent.setup();
    const file = new File([Uint8Array.from([1, 2, 3, 4])], 'sugar.png', { type: 'image/png' });
    (apiService.createCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 'prod-new',
        name: 'Sugar',
        price: '90.00',
        quantity: '1',
        availability: 'in_stock',
        image_url: 'https://cdn.example/sugar.jpg',
      },
    });
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await user.upload(screen.getByLabelText(/^photo$/i), file);

    expect(await screen.findByRole('img', { name: /photo preview/i })).toHaveAttribute(
      'src',
      'data:image/png;base64,AQIDBA=='
    );

    await user.type(screen.getByRole('textbox', { name: /^name$/i }), 'Sugar');
    await user.type(screen.getByRole('textbox', { name: /^price$/i }), '90');
    (apiService.listCatalogProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        products: [
          {
            id: 'prod-new',
            name: 'Sugar',
            price: '90.00',
            quantity: '1',
            availability: 'in_stock',
            image_url: 'https://cdn.example/sugar.jpg',
          },
        ],
      },
    });
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(apiService.createCatalogProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sugar',
          price: '90',
          image_base64: 'AQIDBA==',
          image_filename: 'sugar.png',
          image_content_type: 'image/png',
        })
      );
    });
    const saved = await screen.findAllByRole('img', { name: 'Sugar' });
    expect(saved[0]).toHaveAttribute('src', 'https://cdn.example/sugar.jpg');
    expect(screen.queryByRole('img', { name: /photo preview/i })).not.toBeInTheDocument();
  });

  it('marks a product unavailable without deleting it', async () => {
    const user = userEvent.setup();
    (apiService.updateCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...maize, availability: 'out_of_stock' },
    });
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.click(screen.getAllByRole('button', { name: /mark maize flour unavailable/i })[0]);

    await waitFor(() => {
      expect(apiService.updateCatalogProduct).toHaveBeenCalledWith('prod-1', {
        availability: 'out_of_stock',
      });
    });
    expect(apiService.deleteCatalogProduct).not.toHaveBeenCalled();
  });

  it('deletes a product after confirmation', async () => {
    const user = userEvent.setup();
    (apiService.deleteCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'prod-1' },
    });
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.click(screen.getAllByRole('button', { name: /delete maize flour/i })[0]);
    await user.click(screen.getByRole('button', { name: /delete product/i }));

    await waitFor(() => {
      expect(apiService.deleteCatalogProduct).toHaveBeenCalledWith('prod-1');
    });
  });

  it('keeps the product when delete is cancelled', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Maize flour');

    await user.click(screen.getAllByRole('button', { name: /delete maize flour/i })[0]);
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(apiService.deleteCatalogProduct).not.toHaveBeenCalled();
    expect(screen.getAllByText('Maize flour').length).toBeGreaterThan(0);
  });
});
