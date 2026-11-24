import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './Modal';

const ConfirmContext = createContext(null);

// const confirm = useConfirm();
// if (!(await confirm({ title, message, confirmLabel, tone: 'danger' }))) return;
export function ConfirmProvider({ children }) {
    const [request, setRequest] = useState(null);
    const resolver = useRef(null);

    const confirm = useCallback((options) => new Promise((resolve) => {
        resolver.current?.(false); // a newer question replaces an unanswered one
        resolver.current = resolve;
        setRequest(options);
    }), []);

    const answer = (value) => {
        resolver.current?.(value);
        resolver.current = null;
        setRequest(null);
    };

    const danger = request?.tone === 'danger';
    const Icon = danger ? AlertTriangle : HelpCircle;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                open={Boolean(request)}
                onClose={() => answer(false)}
                title={request?.title || 'Are you sure?'}
                size="sm"
                footer={(
                    <>
                        <button type="button" onClick={() => answer(false)} className="btn-outline">
                            {request?.cancelLabel || 'Cancel'}
                        </button>
                        <button
                            type="button"
                            onClick={() => answer(true)}
                            data-autofocus
                            className={danger ? 'btn bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'}
                        >
                            {request?.confirmLabel || 'Confirm'}
                        </button>
                    </>
                )}
            >
                <div className="flex gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${danger ? 'bg-rose-50 text-rose-600' : 'bg-primary-50 text-primary-600'}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="text-sm leading-6 text-slate-600">{request?.message}</div>
                </div>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used inside <ConfirmProvider>');
    return context;
}
