import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Package, Plus, RefreshCw } from 'lucide-react';
import toast from '../lib/notify';
import { mapApiError } from '../lib/mapApiError';
import { hubPrimaryBtn, hubSection, hubSectionHeader } from '../lib/hubPolish';
import apiService from '../services/api';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in_stock', label: 'In stock' },
  { id: 'out_of_stock', label: 'Out of stock' },
] as const;

type StockFilter = (typeof FILTERS)[number]['id'];

interface CatalogProductRow {
  id: string;
  name?: string;
  price?: string | null;
  quantity?: string | null;
  availability?: string;
  image_url?: string;
}

function labelAvailability(value?: string): string {
  return String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function availabilityTone(value?: string): string {
  const key = String(value || '').toLowerCase();
  if (key === 'in_stock') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  }
  if (key === 'out_of_stock') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
  }
  return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
}

function showText(value?: string | null): string {
  if (value == null || value === '') return '—';
  return String(value);
}

const Thumb: React.FC<{ product: CatalogProductRow }> = ({ product }) => {
  const name = product.name || 'Product';
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={name}
        className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-slate-800"
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400"
      aria-hidden
    >
      <Package className="w-4 h-4" />
    </div>
  );
};

const CatalogProducts: React.FC = () => {
  const [products, setProducts] = useState<CatalogProductRow[]>([]);
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadError, setLoadError] = useState('');

  const visible = useMemo(
    () => products.filter((product) => stockFilter === 'all' || product.availability === stockFilter),
    [products, stockFilter]
  );

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      void (async () => {
        try {
          const trimmed = query.trim();
          const response = await apiService.listCatalogProducts(trimmed ? { q: trimmed } : undefined);
          if (cancelled) return;
          setProducts((response?.data?.products || []) as CatalogProductRow[]);
          setLoadError('');
        } catch (error) {
          if (cancelled) return;
          const message = mapApiError(error, 'Could not load products');
          setProducts([]);
          setLoadError(message);
          toast.error(message);
        } finally {
          if (!cancelled) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, reloadKey]);

  const reload = () => {
    setRefreshing(true);
    setReloadKey((current) => current + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-800 to-primary-500 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Products</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Search the live catalog. Stock filters stay on this page.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAdding(true)} className={hubPrimaryBtn}>
              <Plus className="w-4 h-4" />
              Add
            </button>
            <button
              type="button"
              onClick={reload}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {adding && (
          <div className={`${hubSection} p-5 mb-4`}>
            <h2 className={hubSectionHeader}>Add a product</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              The product form opens here.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-slate-200" htmlFor="catalog-search">
            Search
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, SKU, or brand"
              className="mt-1 block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Availability">
            {FILTERS.map((filter) => {
              const active = stockFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStockFilter(filter.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors ${
                    active
                      ? 'bg-secondary-800 text-white border-secondary-800'
                      : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading…
          </div>
        ) : loadError ? (
          <div className={`${hubSection} p-8`} role="alert">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{loadError}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              The catalog could not be loaded. Try the search again or refresh.
            </p>
          </div>
        ) : (
          <div className={`${hubSection} overflow-hidden`}>
            {products.length === 0 ? (
              <div className="p-8 text-sm text-gray-500 dark:text-slate-400">
                <p>No products yet</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-sm text-gray-500 dark:text-slate-400">No products in this view.</div>
            ) : (
              <>
                <table className="hidden lg:table w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                      <th className="px-3 py-2 font-semibold">Thumb</th>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Price</th>
                      <th className="px-3 py-2 font-semibold">Qty</th>
                      <th className="px-3 py-2 font-semibold">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 dark:border-slate-800 last:border-0">
                        <td className="px-3 py-2">
                          <Thumb product={product} />
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{product.name || '—'}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{showText(product.price)}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{showText(product.quantity)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex text-xs font-semibold px-2 py-1 rounded-full ${availabilityTone(product.availability)}`}>
                            {labelAvailability(product.availability)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="lg:hidden divide-y divide-gray-100 dark:divide-slate-800">
                  {visible.map((product) => (
                    <li key={product.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Thumb product={product} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">{product.name || '—'}</p>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{showText(product.price)}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Qty <span>{showText(product.quantity)}</span>
                          </p>
                          <span className={`inline-flex mt-2 text-xs font-semibold px-2 py-1 rounded-full ${availabilityTone(product.availability)}`}>
                            {labelAvailability(product.availability)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogProducts;
