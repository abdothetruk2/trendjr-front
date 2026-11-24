import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Expand, ImageOff, X, ZoomIn, ZoomOut } from 'lucide-react';
import ProductImage from './ProductImage';
import useFocusTrap from '../hooks/useFocusTrap';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const smooth = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

// Keeps the active thumbnail visible inside its scrolling row
function useScrollThumbIntoView(rowRef, index) {
  useEffect(() => {
    const row = rowRef.current;
    const thumb = row?.children[index];
    if (!row || !thumb) return;
    const left = thumb.offsetLeft - (row.clientWidth - thumb.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: smooth() });
  }, [rowRef, index]);
}

// Product photos: a swipeable main image (arrows, thumbnails, hover zoom on desktop)
// that opens a full-screen viewer with zoom.
// images: [{ src, fallbackSrc }]; children: overlays on the main image (badges, buttons).
export default function ProductGallery({ images, alt, children }) {
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(null); // { x, y } in % while the mouse hovers the photo
  const trackRef = useRef(null);
  const thumbsRef = useRef(null);
  const targetRef = useRef(null); // photo being scrolled to by a button
  const count = images.length;
  const many = count > 1;

  const goTo = useCallback((i) => {
    const next = (i + count) % count;
    const track = trackRef.current;
    setIndex(next);
    setZoom(null);
    if (track) {
      targetRef.current = next;
      track.scrollTo({ left: next * track.clientWidth, behavior: smooth() });
    }
  }, [count]);

  // Swiping (or scrolling) the track picks the photo that is mostly in view
  function onScroll() {
    const track = trackRef.current;
    if (!track?.clientWidth) return;
    const current = Math.round(track.scrollLeft / track.clientWidth);
    if (targetRef.current !== null) {
      if (current !== targetRef.current) return; // still moving to the chosen photo
      targetRef.current = null;
    }
    setIndex(Math.min(count - 1, Math.max(0, current)));
  }

  // Stay on the same photo when the gallery is resized
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      targetRef.current = null;
      track.scrollTo({ left: Math.round(track.scrollLeft / (track.clientWidth || 1)) * track.clientWidth });
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useScrollThumbIntoView(thumbsRef, index);

  // After closing the viewer, show the photo it ended on
  const closeViewer = useCallback((lastIndex) => {
    setViewerOpen(false);
    if (lastIndex !== undefined && lastIndex !== index) goTo(lastIndex);
  }, [goTo, index]);

  function onKeyDown(e) {
    if (!many || viewerOpen) return; // the viewer handles its own keys
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
  }

  function onPointerMove(e, i) {
    if (e.pointerType !== 'mouse' || i !== index) return;
    const box = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 });
  }

  if (count === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <ProductImage src="" alt={alt} fit="contain" className="aspect-square" />
        {children}
      </div>
    );
  }

  return (
    <div onKeyDown={onKeyDown} role="group" aria-roledescription="carousel" aria-label={`${alt} photos`}>
      <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div
          ref={trackRef}
          dir="ltr"
          onScroll={onScroll}
          onPointerDown={() => { targetRef.current = null; }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => { setIndex(i); setViewerOpen(true); }}
              onPointerMove={(e) => onPointerMove(e, i)}
              onPointerLeave={() => setZoom(null)}
              tabIndex={i === index ? 0 : -1}
              aria-label={`Open photo ${i + 1} of ${count} full screen`}
              aria-hidden={i === index ? undefined : true}
              className="relative w-full shrink-0 snap-center snap-always overflow-hidden cursor-zoom-in"
            >
              <div
                className="transition-transform duration-150 ease-out"
                style={zoom && i === index ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              >
                <ProductImage
                  src={image.src}
                  fallbackSrc={image.fallbackSrc}
                  alt={count > 1 ? `${alt} — photo ${i + 1}` : alt}
                  fit="contain"
                  priority={i === 0}
                  className="aspect-square"
                  imgClassName="p-4 sm:p-6"
                />
              </div>
            </button>
          ))}
        </div>

        {children}

        {many && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-secondary shadow-md transition hover:bg-white hover:text-primary-600"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-secondary shadow-md transition hover:bg-white hover:text-primary-600"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2">
          {many && (
            <span className="rounded-full bg-secondary/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur" aria-live="polite">
              {index + 1} / {count}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label="View photos full screen"
          className="absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow-md hover:text-primary-600"
        >
          <Expand size={16} aria-hidden="true" />
        </button>
      </div>

      {many && (
        <div ref={thumbsRef} className="no-scrollbar relative mt-3 flex gap-2 overflow-x-auto p-0.5">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index ? 'true' : undefined}
              className={`w-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:w-20 ${
                i === index ? 'border-primary-500 shadow-sm' : 'border-slate-200 opacity-70 hover:border-primary-200 hover:opacity-100'
              }`}
            >
              <ProductImage
                src={image.src}
                fallbackSrc={image.fallbackSrc}
                alt=""
                fit="contain"
                className="aspect-square"
                imgClassName="p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Portal: the gallery column is sticky (its own stacking context), so the viewer
          has to live at the top level to cover the header */}
      {viewerOpen && createPortal(
        <PhotoViewer images={images} startIndex={index} alt={alt} onClose={closeViewer} />,
        document.body,
      )}
    </div>
  );
}

// Full-screen photo viewer: arrows / swipe / ← → keys to browse, tap or the
// zoom button to zoom in (move the pointer to look around), Esc to close.
function PhotoViewer({ images, startIndex, alt, onClose }) {
  const ref = useRef(null);
  const thumbsRef = useRef(null);
  const pointer = useRef(null);
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(null); // { x, y } in % when zoomed in
  const [failed, setFailed] = useState({}); // src -> true when it couldn't load
  const count = images.length;
  const close = useCallback(() => onClose(index), [onClose, index]);

  useFocusTrap(ref, true, close);
  useBodyScrollLock(true);
  useScrollThumbIntoView(thumbsRef, index);

  const go = useCallback((step) => {
    setZoom(null);
    setIndex((i) => (i + step + count) % count);
  }, [count]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' && count > 1) go(1);
      if (e.key === 'ArrowLeft' && count > 1) go(-1);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, count]);

  const pointAt = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 };
  };

  function onPointerDown(e) {
    pointer.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e) {
    // While zoomed in, the photo follows the pointer (mouse hover or a dragging finger)
    if (zoom && (e.pointerType === 'mouse' || pointer.current)) setZoom(pointAt(e));
  }
  function onPointerUp(e) {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setZoom(zoom ? null : pointAt(e)); // a tap or click toggles zoom
    } else if (!zoom && count > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  }

  const image = images[index];
  const src = failed[image.src] ? image.fallbackSrc : image.src;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo viewer`}
      tabIndex={-1}
      className="fixed inset-0 z-[70] flex flex-col bg-secondary-950/95 text-white outline-none backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm font-bold" aria-live="polite">
          {count > 1 ? `${index + 1} / ${count}` : 'Photo'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(zoom ? null : { x: 50, y: 50 })}
            aria-label={zoom ? 'Zoom out' : 'Zoom in'}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            {zoom ? <ZoomOut size={19} aria-hidden="true" /> : <ZoomIn size={19} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={close}
            data-autofocus
            aria-label="Close photo viewer"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 px-2 sm:px-16">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { pointer.current = null; }}
          className={`relative mx-auto h-full max-w-5xl touch-none select-none overflow-hidden rounded-2xl bg-white ${
            zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
        >
          {src ? (
            <img
              key={src}
              src={src}
              alt={count > 1 ? `${alt} — photo ${index + 1}` : alt}
              draggable={false}
              onError={() => setFailed((f) => ({ ...f, [image.src]: true }))}
              className="h-full w-full object-contain p-2 transition-transform duration-200 ease-out sm:p-6"
              style={zoom ? { transform: 'scale(2.5)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          ) : (
            <div className="grid h-full place-items-center text-slate-400">
              <ImageOff className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-secondary shadow-lg hover:bg-white sm:left-4"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-secondary shadow-lg hover:bg-white sm:right-4"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div ref={thumbsRef} className="no-scrollbar relative mx-auto flex max-w-full gap-2 overflow-x-auto px-4 py-3">
          {images.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => { setZoom(null); setIndex(i); }}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index ? 'true' : undefined}
              className={`w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                i === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-90'
              }`}
            >
              <ProductImage src={item.src} fallbackSrc={item.fallbackSrc} alt="" fit="contain" className="aspect-square" imgClassName="p-1" />
            </button>
          ))}
        </div>
      )}
      <p className="sr-only">Use the left and right arrow keys to browse, Escape to close.</p>
    </div>
  );
}
