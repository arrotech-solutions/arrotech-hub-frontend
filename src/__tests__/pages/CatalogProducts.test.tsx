/**
 * Products desk: list, search, stock filters, and product writes.
 */
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
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

const setupUser = () =>
  userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
    delay: null,
  });

/** Run the 250ms catalog debounce and the fetch it starts, inside act. */
async function flushCatalog() {
  await act(async () => {
    jest.advanceTimersByTime(250);
    await Promise.resolve();
  });
}

/** Let a click or keystroke promise finish. Writes that reload the list settle on the next act, after React commits the debounce. */
async function settleAction(action: () => Promise<unknown>, reload = false) {
  await act(async () => {
    await action();
    await Promise.resolve();
  });
  if (reload) {
    await flushCatalog();
  }
}

/** FileReader in jsdom completes on Node's setImmediate, which stays real under fake timers. */
async function flushFileReader(action: () => Promise<unknown>) {
  const { setImmediate: scheduleImmediate } = require('timers') as {
    setImmediate: (callback: () => void) => void;
  };
  await act(async () => {
    await action();
    await new Promise<void>((resolve) => scheduleImmediate(resolve));
    await new Promise<void>((resolve) => scheduleImmediate(resolve));
    await Promise.resolve();
  });
}

describe('CatalogProducts page', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
    jest.clearAllMocks();
    (apiService.listCatalogProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: [maize] },
    });
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it('loads the catalog through listCatalogProducts', async () => {
    renderPage();
    await flushCatalog();

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getAllByText('Maize flour').length).toBeGreaterThan(0);
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
    await flushCatalog();

    expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  });

  it('calls listCatalogProducts with the typed search query', async () => {
    const user = setupUser();
    renderPage();
    await flushCatalog();

    await settleAction(() => user.type(screen.getByRole('searchbox', { name: /search/i }), 'flour'), true);

    expect(apiService.listCatalogProducts).toHaveBeenCalledWith({ q: 'flour' });
  });

  it('filters availability on the client', async () => {
    const user = setupUser();
    (apiService.listCatalogProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: [maize, oil] },
    });
    renderPage();
    await flushCatalog();

    await settleAction(() => user.click(screen.getByRole('button', { name: /^out of stock$/i })));

    expect(screen.queryAllByText('Maize flour')).toHaveLength(0);
    expect(screen.getAllByText('Cooking oil').length).toBeGreaterThan(0);
  });

  it('toasts a mapped error when the catalog fails to load', async () => {
    (apiService.listCatalogProducts as jest.Mock).mockRejectedValue(new Error('catalog down'));
    renderPage();
    await flushCatalog();

    expect(toast.error).toHaveBeenCalledWith('catalog down');
  });

  it('shows an error state instead of an empty catalog when the list fails', async () => {
    (apiService.listCatalogProducts as jest.Mock).mockRejectedValue(new Error('catalog down'));
    renderPage();
    await flushCatalog();

    expect(screen.getByRole('alert')).toHaveTextContent(/catalog down/i);
    expect(screen.queryByText(/no products yet/i)).not.toBeInTheDocument();
  });

  it('drops the previous rows when a search fails', async () => {
    const user = setupUser();
    renderPage();
    await flushCatalog();

    (apiService.listCatalogProducts as jest.Mock).mockRejectedValue(new Error('search failed'));
    await settleAction(() => user.type(screen.getByRole('searchbox', { name: /search/i }), 'flour'), true);

    expect(screen.getByRole('alert')).toHaveTextContent(/search failed/i);
    expect(screen.queryAllByText('Maize flour')).toHaveLength(0);
    expect(screen.queryByText(/no products yet/i)).not.toBeInTheDocument();
  });

  it('shows a loading state while the catalog request is in flight', () => {
    (apiService.listCatalogProducts as jest.Mock).mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('creates a product from the add panel', async () => {
    const user = setupUser();
    (apiService.createCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'prod-new', name: 'Sugar', price: '120.00', availability: 'in_stock' },
    });
    renderPage();
    await flushCatalog();

    await settleAction(() => user.click(screen.getByRole('button', { name: /^add$/i })));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^name$/i }), 'Sugar'));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^price$/i }), '120'));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^description$/i }), 'White sugar'));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^category$/i }), 'Staples'));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^brand$/i }), 'Mumias'));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^sku$/i }), 'SUG-1'));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^quantity$/i }), '5'));
    await settleAction(() => user.selectOptions(screen.getByRole('combobox', { name: /^availability$/i }), 'in_stock'));
    await settleAction(() => user.click(screen.getByRole('button', { name: /^save$/i })), true);

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

  it('saves an edited product through updateCatalogProduct', async () => {
    const user = setupUser();
    (apiService.updateCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...maize, price: '200' },
    });
    renderPage();
    await flushCatalog();

    await settleAction(() => user.click(screen.getAllByRole('button', { name: /edit maize flour/i })[0]));
    const price = screen.getByRole('textbox', { name: /^price$/i });
    await settleAction(() => user.clear(price));
    await settleAction(() => user.type(price, '200'));
    await settleAction(() => user.click(screen.getByRole('button', { name: /^save$/i })), true);

    expect(apiService.updateCatalogProduct).toHaveBeenCalledWith(
      'prod-1',
      expect.objectContaining({
        name: 'Maize flour',
        price: '200',
        availability: 'in_stock',
      })
    );
  });

  it('previews a chosen photo locally and sends base64 on save', async () => {
    const user = setupUser();
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
    await flushCatalog();

    await settleAction(() => user.click(screen.getByRole('button', { name: /^add$/i })));
    await flushFileReader(() => user.upload(screen.getByLabelText(/^photo$/i), file));

    expect(screen.getByRole('img', { name: /photo preview/i })).toHaveAttribute(
      'src',
      'data:image/png;base64,AQIDBA=='
    );

    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^name$/i }), 'Sugar'));
    await settleAction(() => user.type(screen.getByRole('textbox', { name: /^price$/i }), '90'));
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
    await settleAction(() => user.click(screen.getByRole('button', { name: /^save$/i })), true);

    expect(apiService.createCatalogProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sugar',
        price: '90',
        image_base64: 'AQIDBA==',
        image_filename: 'sugar.png',
        image_content_type: 'image/png',
      })
    );
    const saved = screen.getAllByRole('img', { name: 'Sugar' });
    expect(saved[0]).toHaveAttribute('src', 'https://cdn.example/sugar.jpg');
    expect(screen.queryByRole('img', { name: /photo preview/i })).not.toBeInTheDocument();
  });

  it('marks a product unavailable without deleting it', async () => {
    const user = setupUser();
    (apiService.updateCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...maize, availability: 'out_of_stock' },
    });
    renderPage();
    await flushCatalog();

    await settleAction(() => user.click(screen.getAllByRole('button', { name: /mark maize flour unavailable/i })[0]));

    expect(apiService.updateCatalogProduct).toHaveBeenCalledWith('prod-1', {
      availability: 'out_of_stock',
    });
    expect(apiService.deleteCatalogProduct).not.toHaveBeenCalled();
  });

  it('deletes a product after confirmation', async () => {
    const user = setupUser();
    (apiService.deleteCatalogProduct as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'prod-1' },
    });
    renderPage();
    await flushCatalog();

    await settleAction(() => user.click(screen.getAllByRole('button', { name: /delete maize flour/i })[0]));
    await settleAction(() => user.click(screen.getByRole('button', { name: /delete product/i })), true);

    expect(apiService.deleteCatalogProduct).toHaveBeenCalledWith('prod-1');
  });

  it('keeps the product when delete is cancelled', async () => {
    const user = setupUser();
    renderPage();
    await flushCatalog();

    await settleAction(() => user.click(screen.getAllByRole('button', { name: /delete maize flour/i })[0]));
    await settleAction(() => user.click(screen.getByRole('button', { name: /^cancel$/i })));

    expect(apiService.deleteCatalogProduct).not.toHaveBeenCalled();
    expect(screen.getAllByText('Maize flour').length).toBeGreaterThan(0);
  });
});
