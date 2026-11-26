import i18n from '../i18n';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 1;

const STYLES = {
    success: { icon: CheckCircle2, ring: 'ring-emerald-200', iconColor: 'text-emerald-500' },
    error: { icon: AlertCircle, ring: 'ring-rose-200', iconColor: 'text-rose-500' },
    info: { icon: Info, ring: 'ring-sky-200', iconColor: 'text-sky-500' },
};

// Small notifications in the corner: toast.success('Saved'), toast.error(message)
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts((list) => list.filter((t) => t.id !== id));
    }, []);

    const show = useCallback((type, message, { duration } = {}) => {
        const id = nextId++;
        setToasts((list) => [...list.slice(-3), { id, type, message }]);
        const ms = duration ?? (type === 'error' ? 6000 : 3500);
        timers.current.set(id, setTimeout(() => dismiss(id), ms));
        return id;
    }, [dismiss]);

    useEffect(() => {
        const map = timers.current;
        return () => map.forEach((timer) => clearTimeout(timer));
    }, []);

    const toast = useMemo(() => ({
        success: (message, options) => show('success', message, options),
        error: (message, options) => show('error', message, options),
        info: (message, options) => show('info', message, options),
        dismiss,
    }), [show, dismiss]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="pointer-events-none fixed bottom-4 end-4 start-4 z-80 flex flex-col items-end gap-2 sm:start-auto" aria-live="polite" aria-atomic="false">
                {toasts.map(({ id, type, message }) => {
                    const { icon: Icon, ring, iconColor } = STYLES[type] || STYLES.info;
                    return (
                        <div
                            key={id}
                            role={type === 'error' ? 'alert' : 'status'}
                            className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-xl ring-1 ${ring} animate-[toast-in_200ms_ease-out] sm:max-w-sm`}
                        >
                            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
                            <p className="flex-1 font-semibold text-slate-800">{message}</p>
                            <button
                                type="button"
                                onClick={() => dismiss(id)}
                                className="-me-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                aria-label={i18n.t('common.dismiss')}
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used inside <ToastProvider>');
    return context;
}
