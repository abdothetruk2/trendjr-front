import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { getProductView } from '../utils/product';

const CartContext = createContext(null);
const KEY = 'trendjr_cart';
const MAX_QTY = 10; // when the product has no stock number

function readCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(saved) ? saved : [];
    } catch (err) {
        console.warn('Ignoring an unreadable saved cart:', err.message);
        return [];
    }
}

const maxFor = (item) => (item.stock > 0 ? item.stock : MAX_QTY);

// Shopping cart kept in localStorage (survives reloads). Prices are a snapshot for
// display; the backend uses the real database prices when an order is placed.
export function CartProvider({ children }) {
    const [items, setItems] = useState(readCart);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    useEffect(() => {
        localStorage.setItem(KEY, JSON.stringify(items));
    }, [items]);

    // Keep tabs in sync
    useEffect(() => {
        const onStorage = (e) => { if (e.key === KEY) setItems(readCart()); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    const addItem = useCallback((product, quantity = 1) => {
        const view = getProductView(product);
        setItems((list) => {
            const existing = list.find((item) => item.id === view.id);
            if (existing) {
                return list.map((item) => item.id === view.id
                    ? { ...item, quantity: Math.min(maxFor(item), item.quantity + quantity) }
                    : item);
            }
            const item = {
                id: view.id, title: view.title, image: view.image, imageFallback: view.imageFallback,
                price: view.price, oldPrice: view.oldPrice, stock: view.stock,
            };
            return [...list, { ...item, quantity: Math.min(maxFor(item), quantity) }];
        });
        clearTimeout(toastTimer.current);
        setToast(view.title);
        toastTimer.current = setTimeout(() => setToast(null), 2500);
    }, []);

    const setQuantity = useCallback((id, quantity) => {
        setItems((list) => list.map((item) => item.id === id
            ? { ...item, quantity: Math.max(1, Math.min(maxFor(item), quantity)) }
            : item));
    }, []);

    const removeItem = useCallback((id) => setItems((list) => list.filter((item) => item.id !== id)), []);
    const clearCart = useCallback(() => setItems([]), []);

    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, count, subtotal, addItem, setQuantity, removeItem, clearCart, maxFor }}>
            {children}
            {toast && (
                <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm text-white shadow-2xl sm:max-w-sm" role="status">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                        <span className="block font-bold">Added to cart</span>
                        <span className="block truncate text-xs text-slate-300">{toast}</span>
                    </span>
                    <Link to="/cart" onClick={() => setToast(null)} className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20">View cart</Link>
                    <button type="button" onClick={() => setToast(null)} className="shrink-0 text-slate-400 hover:text-white" aria-label="Close">
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
