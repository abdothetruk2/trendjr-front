import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TopPromoBar from '../src/components/TopPromoBar';
import CategoryStrip from '../src/components/CategoryStrip';
import HeroBanner from '../src/components/HeroBanner';
import FlashDeals from '../src/components/FlashDeals';
import ProductGrid from '../src/components/ProductGrid';
import TrustSection from '../src/components/TrustSection';
import Loader from '../src/components/Loader';
import useApi from '../src/hooks/useApi';
import useCategories from '../src/hooks/useCategories';
import useCategoryParam from '../src/hooks/useCategoryParam';

// The full-screen brand loader only covers the first homepage load of a visit —
// not later visits to this page, and never category/filter changes.
let splashShown = false;
const SPLASH_MAX_MS = 1200;

export default function Homepage() {

    const navigate = useNavigate();

    // Categories and flash deals from the API (each requested once)
    const categories = useCategories();
    const flash = useApi('/api/products/flash');

    // Selected category slug, kept in the URL (?category=...); 'all' = every product
    const [cat, setCat] = useCategoryParam();

    // Initial loader: wait for categories, flash deals and the first page of products
    const [showSplash] = useState(() => !splashShown);
    const [gridReady, setGridReady] = useState(false);
    const handleGridReady = useCallback(() => setGridReady(true), []);
    // ...but never longer than SPLASH_MAX_MS (a slow API must not hide the page)
    const [splashExpired, setSplashExpired] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setSplashExpired(true), SPLASH_MAX_MS);
        return () => clearTimeout(timer);
    }, []);
    const initialLoading = !splashExpired && (categories.loading || flash.loading || !gridReady);

    useEffect(() => {
        if (!initialLoading) splashShown = true;
    }, [initialLoading]);

    const scrollToProducts = () => {
        document.getElementById('discover-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen flex flex-col bg-surface">

            {showSplash && <Loader done={!initialLoading} />}

            <TopPromoBar />

            <CategoryStrip
                categories={categories.data}
                loading={categories.loading}
                error={categories.error}
                onRetry={categories.retry}
                setCat={setCat}
                cat={cat}
            />

            <main className="flex-1">

                <div className="container-page pt-5">
                    <HeroBanner
                        onShopNow={scrollToProducts}
                        onBrowseOffers={() => navigate('/offers')}
                    />
                </div>

                <FlashDeals
                    products={flash.data}
                    loading={flash.loading}
                    error={flash.error}
                    onRetry={flash.retry}
                />

                <ProductGrid category={cat} onFirstLoad={handleGridReady} eyebrow="Just for you" title="Discover products" />

                <TrustSection />

            </main>

        </div>
    );
}
