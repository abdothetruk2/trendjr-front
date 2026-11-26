import React, { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Star, X } from 'lucide-react';
import ProductImage from '../ProductImage';
import { useToast } from '../../context/ToastContext';
import { getImageUrl, isExternalUrl } from '../../utils/product';
import { ALLOWED_IMAGE_TYPES, uploadImage } from './ImageField';
import i18n from '../../i18n';

const t = (key, options) => i18n.t(key, { ns: 'admin', ...options });

export const MAX_GALLERY_IMAGES = 12; // same limit as the API

// Extra product photos (the `images` list), shown after the main image on the product page.
// Upload several files at once, paste a URL / media path, reorder, remove,
// or promote one to the main image (onMakeMain swaps it with the current main image).
export default function GalleryField({ value, onChange, onMakeMain }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const urlId = useId();
  const [uploading, setUploading] = useState(0);
  const [url, setUrl] = useState('');
  const room = MAX_GALLERY_IMAGES - value.length;

  function add(paths) {
    const next = [...value];
    for (const path of paths) if (path && !next.includes(path)) next.push(path);
    onChange(next.slice(0, MAX_GALLERY_IMAGES));
  }

  async function uploadFiles(fileList) {
    const files = [...(fileList || [])];
    if (files.length === 0) return;
    if (files.length > room) toast.error(t('gallery.roomLeft', { count: room, max: MAX_GALLERY_IMAGES }));
    const batch = files.slice(0, room);
    setUploading(batch.length);
    const paths = [];
    for (const file of batch) {
      try {
        paths.push(await uploadImage(file));
      } catch (err) {
        toast.error(err.message);
      }
      setUploading((n) => n - 1);
    }
    if (paths.length) {
      add(paths);
      toast.success(t('gallery.uploaded', { count: paths.length }));
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function addUrl() {
    const path = url.trim();
    if (!path) return;
    if (!/^(https?:\/\/\S+|\/?(media|uploads)\/[\w\-./]+)$/i.test(path)) {
      toast.error(t('gallery.badUrl'));
      return;
    }
    add([path]);
    setUrl('');
  }

  const move = (index, step) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + step, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-600">{t('gallery.more')}</p>
        <p className="text-[11px] text-slate-400">{value.length} / {MAX_GALLERY_IMAGES}</p>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((path, index) => (
          <li key={path} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
            <ProductImage
              src={getImageUrl(path)}
              fallbackSrc={isExternalUrl(path) ? path : ''}
              alt={t('gallery.photo', { n: index + 2 })}
              fit="contain"
              className="aspect-square"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((p) => p !== path))}
              className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-slate-500 shadow hover:text-rose-600"
              aria-label={t('gallery.remove', { n: index + 2 })}
              title={t('cartPage.remove')}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-1 py-0.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:text-primary-600 disabled:opacity-30"
                aria-label={t('gallery.earlier', { n: index + 2 })}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {onMakeMain && (
                <button
                  type="button"
                  onClick={() => onMakeMain(path)}
                  className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:text-amber-500"
                  aria-label={t('gallery.makeMain', { n: index + 2 })}
                  title={t('gallery.useAsMain')}
                >
                  <Star className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
                className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:text-primary-600 disabled:opacity-30"
                aria-label={t('gallery.later', { n: index + 2 })}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}

        {room > 0 && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading > 0}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400 transition-colors hover:border-primary-300 hover:text-primary-600 disabled:pointer-events-none"
            >
              {uploading > 0 ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span className="text-[11px] font-semibold">Uploading {uploading}…</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[11px] font-semibold">{t('gallery.add')}</span>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => uploadFiles(e.target.files)}
            />
          </li>
        )}
      </ul>

      {room > 0 && (
        // Not a <form>: this sits inside the product form
        <div className="mt-3">
          <label htmlFor={urlId} className="mb-1 block text-[11px] font-semibold text-slate-500">{t('gallery.orUrl')}</label>
          <div className="flex gap-2">
            <input
              id={urlId}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
              placeholder={t('image.urlPlaceholder')}
              className="input"
            />
            <button type="button" onClick={addUrl} className="btn-outline px-3" aria-label={t('gallery.addOne')} disabled={!url.trim()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-slate-400">{t('gallery.hint')}</p>
    </div>
  );
}
