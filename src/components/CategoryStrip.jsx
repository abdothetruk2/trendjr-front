import React, { useState, useEffect } from 'react';
import { TOP_STRIP_CATEGORIES2 } from '../data/categories';
import api from '../services/api';

export default function CategoryStrip({ setCat = () => {}, cat = 'all' }) {

    const [categories, setCategories] = useState(TOP_STRIP_CATEGORIES2);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function getCategory() {
            try {
                const res = await api.get('/api/categories');

                const rawList = Array.isArray(res.data)
                    ? res.data
                    : res.data?.data;

                if (Array.isArray(rawList)) {

                    const formatted = rawList.map((item) => ({
                        id: String(item._id ?? item.id),
                        label:
                            item.name?.en ??
                            item.name?.ar ??
                            item.name ??
                            item.slug
                    }));

                    setCategories([
                        { id: 'all', label: 'All' },
                        ...formatted
                    ]);
                }

            } catch (err) {
                console.error('Failed to fetch categories:', err);
            } finally {
                setLoading(false);
            }
        }

        getCategory();

    }, []);

    function handleActive(id) {
        setCat(id);
    }

    return (
        <div className="bg-white border-b border-slate-200/70">
            <div className="container-page">

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5">

                    {loading ? (

                        Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-8 w-24 shrink-0 rounded-full bg-slate-200 animate-pulse"
                            />
                        ))

                    ) : (

                        categories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => handleActive(category.id)}
                                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                    String(category.id) === String(cat)
                                        ? 'bg-secondary text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                                }`}
                            >
                                {category.label}
                            </button>
                        ))

                    )}

                </div>
            </div>
        </div>
    );
}