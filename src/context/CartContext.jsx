import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { getProductView } from '../utils/product';

const CartContext = createContext(null);
const KEY = 'trendjr_cart';
const MAX_QTY = 10; // per line, when the product's stock isn't tracked

function readCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(saved) ? saved.filter((item) => item && item.id !== undefined) : [];
    } catch (err) {
        console.warn('Ignoring an unreadable saved cart:', err.message);
        return [];
    }
}

// Most a customer can put in the cart for one line
const maxFor = (item) => (item.tracked ? Math.max(0, Number(item.stock) || 0) : MAX_QTY);

// What the cart keeps about a product (a display snapshot; the server re-prices
// everything when the order is placed, and refresh() updates it from the API)
function snapshot(product) {
    const view = getProductView(product);
    return {
        id: view.id,
        slug: view.slug,
        title: view.title,
        // every language of the name, so the cart follows a language switch
        name: product.name && typeof product.name === 'object' ? product.name : undefined,
        image: view.image,
        imageFallback: view.imageFallback,
        price: view.price,
        oldPrice: view.oldPrice,
        stock: view.stock,
        tracked: view.tracked,
    };
}

// Shopping cart kept in localStorage (survives reloads, synced across tabs)
export function CartProvider({ children }) {
    const [items, setItems] = useState(readCart);
    const { t } = useTranslation();
    const [toast, setToast] = useState(null); // { type: 'added' | 'error', title, text }
    const toastTimer = useRef(null);
    const itemsRef = useRef(items);

    useEffect(() => {
        itemsRef.current = items;
        localStorage.setItem(KEY, JSON.stringify(items));
    }, [items]);

    // Keep tabs in sync
    useEffect(() => {
        const onStorage = (e) => { if (e.key === KEY) setItems(readCart()); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    const showToast = useCallback((next) => {
        clearTimeout(toastTimer.current);
        setToast(next);
        toastTimer.current = setTimeout(() => setToast(null), 2800);
    }, []);

    // Returns false (and says why) when the product can't be added
    const addItem = useCallback((product, quantity = 1) => {
        const view = getProductView(product);
        if (!view.inStock) {
            showToast({ type: 'error', title: ['product.outOfStock'], text: view.title });
            return false;
        }
        const fresh = snapshot(product);
        const existing = itemsRef.current.find((item) => String(item.id) === String(view.id));
        if (existing && existing.quantity >= maxFor(fresh)) {
            showToast({ type: 'error', title: ['cart.maxReached', { count: maxFor(fresh) }], text: view.title });
            return false;
        }
        setItems((list) => {
            const current = list.find((item) => String(item.id) === String(view.id));
            if (current) {
                return list.map((item) => (item === current
                    ? { ...item, ...fresh, unavailable: false, priceChanged: false, quantity: Math.max(1, Math.min(maxFor(fresh), item.quantity + quantity)) }
                    : item));
            }
            return [...list, { ...fresh, quantity: Math.max(1, Math.min(maxFor(fresh), quantity)) }];
        });
        showToast({ type: 'added', title: ['cart.added'], text: view.title });
        return true;
    }, [showToast]);

    const setQuantity = useCallback((id, quantity) => {
        setItems((list) => list.map((item) => (String(item.id) === String(id)
            ? { ...item, quantity: Math.max(1, Math.min(Math.max(1, maxFor(item)), quantity)) }
            : item)));
    }, []);

    const removeItem = useCallback((id) => setItems((list) => list.filter((item) => String(item.id) !== String(id))), []);
    const clearCart = useCallback(() => setItems([]), []);

    // Re-reads current prices and stock from the API. Items that were hidden or
    // deleted get `unavailable`, sold-out ones `soldOut`, repriced ones `priceChanged`.
    const refresh = useCallback(async ({ signal } = {}) => {
        const current = itemsRef.current;
        const ids = current.map((item) => String(item.id)).filter((id) => /^\d+$/.test(id));
        if (ids.length === 0) return;
        const res = await api.get(`/api/products?ids=${ids.join(',')}`, { signal });
        const byId = new Map((Array.isArray(res.data) ? res.data : []).map((p) => [String(p.id), p]));
        setItems((list) => list.map((item) => {
            const product = byId.get(String(item.id));
            if (!product) return { ...item, unavailable: true };
            const fresh = snapshot(product);
            const max = maxFor(fresh);
            return {
                ...item,
                ...fresh,
                quantity: max > 0 ? Math.min(item.quantity, max) : item.quantity,
                unavailable: false,
                soldOut: max <= 0,
                priceChanged: item.priceChanged || Math.abs(Number(item.price) - fresh.price) > 0.004,
            };
        }));
    }, []);

    const buyable = items.filter((item) => !item.unavailable && !item.soldOut);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = buyable.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, buyable, count, subtotal, addItem, setQuantity, removeItem, clearCart, refresh, maxFor }}>
            {children}
            {toast && (
                <div className="fixed bottom-20 sm:bottom-6 end-4 start-4 sm:start-auto z-80 flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm text-white shadow-2xl sm:max-w-sm" role="status">
                    {toast.type === 'error'
                        ? <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" aria-hidden="true" />
                        : <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" aria-hidden="true" />}
                    <span className="flex-1 min-w-0">
                        <span className="block font-bold">{t(...toast.title)}</span>
                        <span className="block truncate text-xs text-slate-300">{toast.text}</span>
                    </span>
                    {toast.type === 'added' && (
                        <Link to="/cart" onClick={() => setToast(null)} className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20">{t('cart.viewCart')}</Link>
                    )}
                    <button type="button" onClick={() => setToast(null)} className="shrink-0 text-slate-400 hover:text-white" aria-label={t('common.close')}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used inside <CartProvider>');
    return context;
}
