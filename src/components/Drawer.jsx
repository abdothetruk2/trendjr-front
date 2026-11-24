import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import useFocusTrap from '../hooks/useFocusTrap';

// Off-canvas panel that slides in from the side, over a blurred backdrop.
// Closes on Escape, on a click outside the panel and with the close button;
// keeps keyboard focus inside while open and stops the page from scrolling.
// It stays mounted so it can animate out; while closed it is invisible and inert.
// Rendered in <body> so no parent (e.g. the sticky, blurred header) can clip it.
export default function Drawer({
  open,
  onClose,
  title,
  header = null, // custom header content; `title` is then read by screen readers only
  side = 'left',
  id,
  footer = null,
  closeLabel = 'Close',
  panelClassName = '',
  children,
}) {
  const panelRef = useRef(null);
  const titleId = useId();

  useBodyScrollLock(open);
  useFocusTrap(panelRef, open, onClose);

  const edge = side === 'left' ? 'left-0' : 'right-0';
  const offscreen = side === 'left' ? '-translate-x-full' : 'translate-x-full';

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-60 bg-secondary/40 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        inert={open ? undefined : ''}
        // Opening: visible at once (so focus can move in). Closing: hidden only
        // after the 300ms slide-out has finished.
        className={`fixed inset-y-0 ${edge} z-61 flex w-[86vw] max-w-sm flex-col bg-white shadow-2xl outline-none motion-reduce:transition-none ${
          open
            ? 'visible translate-x-0 [transition:translate_300ms_ease-out,visibility_0s_linear_0s]'
            : `invisible ${offscreen} [transition:translate_300ms_ease-out,visibility_0s_linear_300ms]`
        } ${panelClassName}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
          <h2 id={titleId} className={header ? 'sr-only' : 'text-base font-extrabold text-secondary'}>
            {title}
          </h2>
          {header}
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            aria-label={closeLabel}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer && <div className="shrink-0 border-t border-slate-100">{footer}</div>}
      </div>
    </>,
    document.body
  );
}
