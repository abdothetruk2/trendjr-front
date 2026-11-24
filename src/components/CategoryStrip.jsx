import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { getCategoryLabel } from '../utils/product';

// Top-level categories as filter pills. `cat` is the selected category slug ('all' = everything).
// Categories are loaded once by the page and passed in (no extra request here).
// With product counts (useCategories), categories without products are left out.
export default function CategoryStrip({
    categories = [],
    loading = false,
    error = '',
    onRetry,
    setCat = () => {},
    cat = 'all',
}) {
    const scroller = useRef(null);
    const [edges, setEdges] = useState({ start: false, end: false });

    const list = Array.isArray(categories) ? categories : [];
    const hasCounts = list.some((c) => typeof c.productCount === 'number');
    const totalOf = (category) => (category.productCount || 0) +
        list.filter((c) => c.parent_id != null && c.parent_id === category.id).reduce((sum, c) => sum + (c.productCount || 0), 0);

    const pills = [
        { id: 'all', label: 'All' },
        ...list
            .filter((category) => category.parent_id == null)
            .filter((category) => !hasCounts || totalOf(category) > 0 || category.slug === cat)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
                getCategoryLabel(a).localeCompare(getCategoryLabel(b)))
            .map((category) => ({ id: category.slug, label: getCategoryLabel(category) })),
    ];

    // Which ends of the row still have pills out of view
    const updateEdges = useCallback(() => {
        const el = scroller.current;
        if (!el) return;
        setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    }, []);

    useEffect(() => {
        const el = scroller.current;
        if (!el) return undefined;
        updateEdges();
        const observer = new ResizeObserver(updateEdges);
        observer.observe(el);
        return () => observer.disconnect();
    }, [updateEdges, pills.length, loading]);

    // Keep the selected pill in view (horizontally only, never moving the page)
    useEffect(() => {
        const el = scroller.current;
        const pill = el?.querySelector('[aria-pressed="true"]');
        if (!el || !pill) return;
        const left = pill.offsetLeft - el.offsetLeft;
        if (left < el.scrollLeft || left + pill.offsetWidth > el.scrollLeft + el.clientWidth) {
            el.scrollTo({ left: Math.max(0, left - 24), behavior: 'smooth' });
        }
    }, [cat, loading]);

    const scrollBy = (direction) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.7, behavior: 'smooth' });

    const fade = edges.start || edges.end
        ? `linear-gradient(to right, ${edges.start ? 'transparent, black 32px' : 'black, black'}, ${edges.end ? 'black calc(100% - 32px), transparent' : 'black, black'})`
        : undefined;

    const arrow = 'absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition-colors hover:text-primary-600 sm:grid';

    return (
        <div className="bg-white border-b border-slate-200/70">
            <div className="container-page relative">

                {edges.start && (
                    <button type="button" onClick={() => scrollBy(-1)} className={`${arrow} left-2`} aria-label="Scroll categories left">
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}

                <div
                    ref={scroller}
                    onScroll={updateEdges}
                    className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 snap-x scroll-px-4"
                    style={fade ? { maskImage: fade, WebkitMaskImage: fade } : undefined}
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
                                    className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
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
                                    className="ml-1 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-rose-600 hover:text-rose-700"
                                >
                                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                                    Couldn&apos;t load categories — retry
                                </button>
                            )}
                        </>

                    )}

                </div>

                {edges.end && (
                    <button type="button" onClick={() => scrollBy(1)} className={`${arrow} right-2`} aria-label="Scroll categories right">
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}
