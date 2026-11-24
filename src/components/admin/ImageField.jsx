import React, { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import ProductImage from '../ProductImage';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getImageUrl, isExternalUrl } from '../../utils/product';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED = ALLOWED_IMAGE_TYPES;
const MAX_BYTES = 5 * 1024 * 1024;

// Uploads one image file (POST /api/admin/uploads) and returns its stored path
// ("uploads/abc.jpg"). Throws an Error with a readable message.
export async function uploadImage(file) {
  if (!ALLOWED.includes(file.type)) throw new Error(`${file.name}: choose a JPEG, PNG, WebP or GIF image.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 5 MB. Please choose a smaller one.`);
  try {
    const res = await api.post('/api/admin/uploads', file, {
      headers: { 'Content-Type': file.type },
      timeout: 60000,
    });
    return res.data.path;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

// Image picker: upload a file (POST /api/admin/uploads) or paste a URL / media path.
// `value` is what gets saved in the product or category ("uploads/abc.jpg", "media/x.jpg", "https://…").
export default function ImageField({ value, onChange, label = 'Image', error }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const pathId = useId();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="@container">
      <p className="mb-1.5 block text-xs font-bold text-slate-600">{label}</p>
      {/* Side by side only when this field itself is wide enough (not the screen) */}
      <div className="flex flex-col gap-4 @md:flex-row">
        <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {value ? (
            <ProductImage src={getImageUrl(value)} fallbackSrc={isExternalUrl(value) ? value : ''} alt="Preview" fit="contain" className="h-full w-full" />
          ) : (
            <div className="grid h-full place-items-center text-slate-300">
              <ImagePlus className="h-9 w-9" aria-hidden="true" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-white/80" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" />
              <span className="sr-only">Uploading…</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
              dragging ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-white'
            }`}
          >
            <UploadCloud className="h-6 w-6 text-slate-400" aria-hidden="true" />
            <p className="text-xs text-slate-500">Drop an image here, or</p>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-outline btn-sm">
              {uploading ? 'Uploading…' : 'Choose a file'}
            </button>
            <p className="text-[11px] text-slate-400">JPEG, PNG, WebP or GIF · max 5 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED.join(',')}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </div>

          <div>
            <label htmlFor={pathId} className="mb-1 block text-[11px] font-semibold text-slate-500">…or an image URL / media path</label>
            <div className="flex gap-2">
              <input
                id={pathId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://… or media/photo.jpg"
                className="input"
                aria-invalid={error ? true : undefined}
              />
              {value && (
                <button type="button" onClick={() => onChange('')} className="btn-outline px-3" aria-label="Remove image">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {error && <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
