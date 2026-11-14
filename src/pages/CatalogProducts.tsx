import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Package, Plus, RefreshCw } from 'lucide-react';
import toast from '../lib/notify';
import { mapApiError } from '../lib/mapApiError';
import {
  hubDangerBtn,
  hubFieldLabel,
  hubModalBackdrop,
  hubModalFrame,
  hubPrimaryBtn,
  hubSection,
  hubSectionHeader,
} from '../lib/hubPolish';
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
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  sku?: string | null;
  quantity?: string | null;
  availability?: string;
  image_url?: string;
}

interface ProductDraft {
  name: string;
  price: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  quantity: string;
  availability: 'in_stock' | 'out_of_stock';
}

interface EncodedPhoto {
  image_base64: string;
  image_filename: string;
  image_content_type: string;
}

const EMPTY_DRAFT: ProductDraft = {
  name: '',
  price: '',
  description: '',
  category: '',
  brand: '',
  sku: '',
  quantity: '',
  availability: 'in_stock',
};

const fieldClass =
  'mt-1 block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium';

function draftFromProduct(product: CatalogProductRow): ProductDraft {
  return {
    name: product.name || '',
    price: product.price || '',
    description: product.description || '',
    category: product.category || '',
    brand: product.brand || '',
    sku: product.sku || '',
    quantity: product.quantity || '',
    availability: product.availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
  };
}

/** Raw base64 plus a local data URL, matching catalog image_base64 writes. */
function encodeImageFile(file: File): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
      resolve({ dataUrl, base64 });
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read that photo'));
    reader.readAsDataURL(file);
  });
}

function productPayload(draft: ProductDraft, photo: EncodedPhoto | null): Record<string, string> {
  const payload: Record<string, string> = {
    name: draft.name.trim(),
    price: draft.price.trim(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    brand: draft.brand.trim(),
    sku: draft.sku.trim(),
    quantity: draft.quantity.trim(),
    availability: draft.availability,
  };
  if (photo) {
    payload.image_base64 = photo.image_base64;
    payload.image_filename = photo.image_filename;
    payload.image_content_type = photo.image_content_type;
  }
  return payload;
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

const ProductActions: React.FC<{
  product: CatalogProductRow;
  onEdit: (product: CatalogProductRow) => void;
  onUnavailable: (product: CatalogProductRow) => void;
  onDelete: (product: CatalogProductRow) => void;
}> = ({ product, onEdit, onUnavailable, onDelete }) => {
  const name = product.name || 'product';
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      <button
        type="button"
        aria-label={`Edit ${name}`}
        onClick={() => onEdit(product)}
        className="text-xs font-semibold text-secondary-800 dark:text-secondary-200"
      >
        Edit
      </button>
      {product.availability !== 'out_of_stock' && (
        <button
          type="button"
          aria-label={`Mark ${name} unavailable`}
          onClick={() => onUnavailable(product)}
          className="text-xs font-semibold text-gray-700 dark:text-slate-200"
        >
          Unavailable
        </button>
      )}
      <button
        type="button"
        aria-label={`Delete ${name}`}
        onClick={() => onDelete(product)}
        className="text-xs font-semibold text-rose-700 dark:text-rose-300"
      >
        Delete
      </button>
    </div>
  );
};

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
  const [reloadKey, setReloadKey] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [panel, setPanel] = useState<null | { mode: 'add' } | { mode: 'edit'; id: string }>(null);
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [photo, setPhoto] = useState<EncodedPhoto | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CatalogProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const closePanel = () => {
    setPanel(null);
    setPhoto(null);
    setPreviewUrl('');
    setDraft(EMPTY_DRAFT);
  };

  const openAdd = () => {
    setDraft(EMPTY_DRAFT);
    setPhoto(null);
    setPreviewUrl('');
    setPanel({ mode: 'add' });
  };

  const openEdit = (product: CatalogProductRow) => {
    setDraft(draftFromProduct(product));
    setPhoto(null);
    setPreviewUrl(product.image_url || '');
    setPanel({ mode: 'edit', id: product.id });
  };

  const onPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await encodeImageFile(file);
      setPreviewUrl(encoded.dataUrl);
      setPhoto({
        image_base64: encoded.base64,
        image_filename: file.name,
        image_content_type: file.type || 'application/octet-stream',
      });
    } catch (error) {
      toast.error(mapApiError(error, 'Could not read that photo'));
    }
  };

  const saveProduct = async () => {
    const payload = productPayload(draft, photo);
    if (!payload.name || !payload.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      if (panel?.mode === 'edit') {
        await apiService.updateCatalogProduct(panel.id, payload);
        toast.success('Product saved');
      } else {
        await apiService.createCatalogProduct(payload);
        toast.success('Product added');
      }
      closePanel();
      reload();
    } catch (error) {
      toast.error(mapApiError(error, 'Could not save product'));
    } finally {
      setSaving(false);
    }
  };

  const markUnavailable = async (product: CatalogProductRow) => {
    try {
      const response = await apiService.updateCatalogProduct(product.id, { availability: 'out_of_stock' });
      const next = (response?.data || { ...product, availability: 'out_of_stock' }) as CatalogProductRow;
      setProducts((current) => current.map((row) => (row.id === product.id ? { ...row, ...next, availability: 'out_of_stock' } : row)));
      toast.success('Marked unavailable');
    } catch (error) {
      toast.error(mapApiError(error, 'Could not update product'));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiService.deleteCatalogProduct(pendingDelete.id);
      toast.success('Product deleted');
      setPendingDelete(null);
      reload();
    } catch (error) {
      toast.error(mapApiError(error, 'Could not delete product'));
    } finally {
      setDeleting(false);
    }
  };

  const setField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
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
            <button type="button" onClick={openAdd} className={hubPrimaryBtn}>
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

        {panel && (
          <div
            className={`${hubModalBackdrop} !items-stretch !justify-end !p-0`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-product-title"
          >
            <form
              className={`${hubSection} ml-auto flex h-full w-full max-w-md flex-col shadow-2xl`}
              onSubmit={(event) => {
                event.preventDefault();
                void saveProduct();
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 px-5 py-4">
                <h2 id="catalog-product-title" className={hubSectionHeader}>
                  {panel.mode === 'add' ? 'Add a product' : 'Edit product'}
                </h2>
                <button type="button" onClick={closePanel} className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                <label className={hubFieldLabel} htmlFor="product-name">
                  Name
                  <input id="product-name" value={draft.name} onChange={(event) => setField('name', event.target.value)} className={fieldClass} />
                </label>
                <label className={hubFieldLabel} htmlFor="product-price">
                  Price
                  <input id="product-price" inputMode="decimal" value={draft.price} onChange={(event) => setField('price', event.target.value)} className={fieldClass} />
                </label>
                <label className={hubFieldLabel} htmlFor="product-description">
                  Description
                  <textarea id="product-description" rows={3} value={draft.description} onChange={(event) => setField('description', event.target.value)} className={fieldClass} />
                </label>
                <label className={hubFieldLabel} htmlFor="product-category">
                  Category
                  <input id="product-category" value={draft.category} onChange={(event) => setField('category', event.target.value)} className={fieldClass} />
                </label>
                <label className={hubFieldLabel} htmlFor="product-brand">
                  Brand
                  <input id="product-brand" value={draft.brand} onChange={(event) => setField('brand', event.target.value)} className={fieldClass} />
                </label>
                <label className={hubFieldLabel} htmlFor="product-sku">
                  SKU
                  <input id="product-sku" value={draft.sku} onChange={(event) => setField('sku', event.target.value)} className={fieldClass} />
                </label>
                <label className={hubFieldLabel} htmlFor="product-quantity">
                  Quantity
                  <input id="product-quantity" inputMode="decimal" value={draft.quantity} onChange={(event) => setField('quantity', event.target.value)} className={fieldClass} />
                </label>
                <label className={hubFieldLabel} htmlFor="product-availability">
                  Availability
                  <select
                    id="product-availability"
                    value={draft.availability}
                    onChange={(event) =>
                      setField(
                        'availability',
                        event.target.value === 'out_of_stock' ? 'out_of_stock' : 'in_stock'
                      )
                    }
                    className={fieldClass}
                  >
                    <option value="in_stock">In stock</option>
                    <option value="out_of_stock">Out of stock</option>
                  </select>
                </label>
                <div>
                  <label className={hubFieldLabel} htmlFor="product-photo">
                    Photo
                  </label>
                  <input id="product-photo" type="file" accept="image/*" onChange={(event) => void onPhoto(event)} className={`${fieldClass} font-normal`} />
                  {previewUrl && (
                    <img src={previewUrl} alt="Photo preview" className="mt-3 h-24 w-24 rounded-xl object-cover bg-gray-100 dark:bg-slate-800" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-slate-800 px-5 py-4">
                <button type="button" onClick={closePanel} className="text-sm font-semibold text-gray-600 dark:text-slate-300 px-3 py-2">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={hubPrimaryBtn}>
                  Save
                </button>
              </div>
            </form>
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
                      <th className="px-3 py-2 font-semibold">Actions</th>
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
                        <td className="px-3 py-2">
                          <ProductActions
                            product={product}
                            onEdit={openEdit}
                            onUnavailable={(row) => void markUnavailable(row)}
                            onDelete={setPendingDelete}
                          />
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
                          <div className="mt-2">
                            <ProductActions
                              product={product}
                              onEdit={openEdit}
                              onUnavailable={(row) => void markUnavailable(row)}
                              onDelete={setPendingDelete}
                            />
                          </div>
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

      {pendingDelete && (
        <div className={hubModalBackdrop} role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title">
          <div className={`${hubModalFrame} max-w-md p-5`}>
            <h2 id="delete-product-title" className={hubSectionHeader}>
              Delete this product?
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              This removes {pendingDelete.name || 'this product'} from the catalog. Mark it unavailable if you only want to stop selling it.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="text-sm font-semibold text-gray-600 dark:text-slate-300 px-3 py-2"
              >
                Cancel
              </button>
              <button type="button" onClick={() => void confirmDelete()} disabled={deleting} className={hubDangerBtn}>
                Delete product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogProducts;
