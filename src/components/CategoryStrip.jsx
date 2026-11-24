import React from 'react';
import { RotateCw } from 'lucide-react';
import { getCategoryLabel } from '../utils/product';

// Top-level categories as filter pills. `cat` is the selected category slug ('all' = everything).
// Categories are loaded once by the page and passed in (no extra request here).
export default function CategoryStrip({
    categories = [],
    loading = false,
    error = '',
    onRetry,
    setCat = () => {},
    cat = 'all',
}) {

    const pills = [
        { id: 'all', label: 'All' },
        ...(Array.isArray(categories) ? categories : [])
            .filter((category) => category.parent_id == null)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
                getCategoryLabel(a).localeCompare(getCategoryLabel(b)))
            .map((category) => ({ id: category.slug, label: getCategoryLabel(category) })),
    ];

    return (
        <div className="bg-white border-b border-slate-200/70">
            <div className="container-page">

                <div
                    className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5"
                    role="toolbar"
                    aria-label="Filter products by category"
                >

                    {loading ? (

                        Array.from({ length: 8 }, (_, i) => (
                            <div
                                key={i}
                                className={`h-8 shrink-0 rounded-full bg-slate-200 animate-pulse ${i === 0 ? 'w-12' : 'w-28'}`}
                                aria-hidden="true"
                            />
                        ))

                    ) : (

                        <>
                            {pills.map((pill) => (
                                <button
                                    key={pill.id}
                                    type="button"
                                    onClick={() => setCat(pill.id)}
                                    aria-pressed={pill.id === cat}
                                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                        pill.id === cat
                                            ? 'bg-secondary text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                                    }`}
                                >
                                    {pill.label}
                                </button>
                            ))}

                            {error && (
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="ml-1 inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-rose-600 hover:text-rose-700"
                                >
                                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                                    Couldn&apos;t load categories — retry
                                </button>
                            )}
                        </>

                    )}

                </div>
            </div>
        </div>
    );
}
