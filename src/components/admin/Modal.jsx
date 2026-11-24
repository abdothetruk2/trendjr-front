import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import useFocusTrap from '../../hooks/useFocusTrap';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

// Centered dialog. Mounted only while open (so forms inside start fresh);
// Escape, the close button or a click on the backdrop closes it.
export default function Modal({ open, onClose, title, description, size = 'md', footer = null, busy = false, children }) {
    if (!open) return null;
    return (
        <ModalPanel onClose={onClose} title={title} description={description} size={size} footer={footer} busy={busy}>
            {children}
        </ModalPanel>
    );
}

function ModalPanel({ onClose, title, description, size, footer, busy, children }) {
    const panelRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    const close = () => { if (!busy) onClose(); };

    useBodyScrollLock(true);
    useFocusTrap(panelRef, true, close);

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-secondary/50 backdrop-blur-sm animate-[fade-in_150ms_ease-out]" aria-hidden="true" onClick={close} />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                className={`relative flex max-h-[92vh] w-full ${SIZES[size] || SIZES.md} flex-col rounded-t-3xl bg-white shadow-2xl outline-none animate-[dialog-in_200ms_ease-out] sm:rounded-3xl`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-lg font-black text-secondary">{title}</h2>
                        {description && <p id={descriptionId} className="mt-0.5 text-sm text-slate-500">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        disabled={busy}
                        className="-mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">{footer}</div>}
            </div>
        </div>,
        document.body
    );
}
