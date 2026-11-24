import React, { useState, useEffect } from 'react';
import { PRODUCTS } from "../src/data/products";
import axios from 'axios';

import TopPromoBar from '../src/components/TopPromoBar';
import CategoryStrip from '../src/components/CategoryStrip';
import HeroBanner from '../src/components/HeroBanner';
import FlashDeals from '../src/components/FlashDeals';
import ProductGrid from '../src/components/ProductGrid';
import TrustSection from '../src/components/TrustSection';
import MobileBottomNav from '../src/components/MobileBottomNav';

import "../src/index.css";

export default function Homepage() {

    const [product, setProduct] = useState(PRODUCTS);

    // Categories from API
    const [categories, setCategories] = useState([]);

    // Selected category
    const [cat, setCat] = useState("all");

    const [filter, setFilter] = useState("all");

    async function GetAll() {
        try {
            const [categoriesRes, productsRes] = await Promise.all([
                axios.get("http://localhost:3000/api/categories"),
                axios.get("http://localhost:3000/api/products")
            ]);

            setCategories(categoriesRes.data);
            setProduct(productsRes.data);

        } catch (error) {
            console.error("API Error:", error);
        }
    }

    useEffect(() => {
        GetAll();
    }, []);

    const FLASH_PRODUCTS = product.filter(
        (p) => p.isFlashDeal
    );

    return (
        <div className="min-h-screen flex flex-col bg-surface">

            <TopPromoBar />

            <CategoryStrip
                categories={categories}
                setCat={setCat}
                cat={cat}
            />

            <main className="flex-1">

                <HeroBanner setFilter={setFilter} />

                <FlashDeals products={FLASH_PRODUCTS} />

                <ProductGrid
                    products={product}
                    cat_id={cat}
                    filter={filter}
                />

                <TrustSection />

            </main>

            <MobileBottomNav />

        </div>
    );
}