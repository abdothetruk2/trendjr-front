import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProductView } from '../utils/product';

const WishlistContext = createContext(null);
const KEY = 'trendjr_wishlist';

function readWishlist() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(saved) ? saved : [];
    } catch (err) {
        console.warn('Ignoring an unreadable saved wishlist:', err.message);
        return [];
    }
}

// A small copy of the product in the same shape the API uses, so a saved item
// renders with the normal <ProductCard> (prices are a snapshot, like the cart).
function snapshot(product) {
    const view = getProductView(product);
    const rawImage = typeof product.image === 'string'
        ? product.image
        : product.image?.url ?? product.images?.[0] ?? '';
    return {
        id: view.id,
        // every language of the name (shown in the visitor's language)
        name: product.name && typeof product.name === 'object' ? product.name : view.title,
        brand: view.brand,
        image: rawImage,
        price: view.price,
        old_price: view.oldPrice || null,
        discount: view.discount,
        rating: view.rating,
        reviews_count: view.reviews,
        stock: view.stock,
        savedAt: Date.now(),
    };
}

// Saved products, kept in localStorage (survives reloads, synced across tabs)
export function WishlistProvider({ children }) {
    const [items, setItems] = useState(readWishlist);

    useEffect(() => {
        localStorage.setItem(KEY, JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        const onStorage = (e) => { if (e.key === KEY) setItems(readWishlist()); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const ids = useMemo(() => new Set(items.map((item) => String(item.id))), [items]);
    const has = useCallback((id) => ids.has(String(id)), [ids]);

    // Adds or removes the product; returns true when it is now saved
    const toggle = useCallback((product) => {
        const id = String(getProductView(product).id);
        const saved = ids.has(id);
        setItems((list) => (saved
            ? list.filter((item) => String(item.id) !== id)
            : [snapshot(product), ...list.filter((item) => String(item.id) !== id)]));
        return !saved;
    }, [ids]);

    const remove = useCallback((id) => {
        setItems((list) => list.filter((item) => String(item.id) !== String(id)));
    }, []);

    const clear = useCallback(() => setItems([]), []);

    const value = useMemo(
        () => ({ items, count: items.length, has, toggle, remove, clear }),
        [items, has, toggle, remove, clear]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used inside <WishlistProvider>');
    return context;
}
