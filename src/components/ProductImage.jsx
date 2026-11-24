import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { webpCopies } from '../utils/product';

// Image with a skeleton while it loads and a placeholder when it can't be shown.
// Tries the WebP copies first, then `src`, then `fallbackSrc` (if given), so no
// broken-image icon ever appears.
// Give the wrapper its size (e.g. "aspect-square") so nothing shifts while loading.
// sizes: how wide the image is shown (CSS sizes syntax); small thumbnails by default.
// priority: load immediately (above-the-fold images); otherwise lazy-load.
export default function ProductImage({
  src,
  fallbackSrc = '',
  alt = '',
  className = '',
  imgClassName = '',
  fit = 'cover',
  priority = false,
  sizes = '96px',
}) {
  const [loadedKey, setLoadedKey] = useState('');
  const [failed, setFailed] = useState([]); // sources that could not be loaded

  const webp = webpCopies(src);
  const candidates = [
    webp && { key: webp.src, src: webp.src, srcSet: webp.srcSet },
    src && { key: src, src },
    fallbackSrc && { key: fallbackSrc, src: fallbackSrc },
  ].filter(Boolean);
  const current = candidates.find((c) => !failed.includes(c.key)) || null;
  const loaded = current !== null && loadedKey === current.key;

  return (
    <div className={`relative overflow-hidden ${fit === 'contain' ? 'bg-white' : 'bg-slate-100'} ${className}`}>
      {current && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />
      )}

      {current ? (
        <img
          key={current.key}
          src={current.src}
          srcSet={current.srcSet}
          sizes={current.srcSet ? sizes : undefined}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : undefined}
          decoding="async"
          onLoad={() => setLoadedKey(current.key)}
          onError={() => setFailed((list) => [...list, current.key])}
          className={`absolute inset-0 w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      ) : (
        <div
          role="img"
          aria-label={alt || 'Image not available'}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400"
        >
          <ImageOff className="w-7 h-7" aria-hidden="true" />
          <span className="text-[11px] font-semibold">No image</span>
        </div>
      )}
    </div>
  );
}
