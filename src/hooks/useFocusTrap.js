import { useEffect, useRef } from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

// Open layers, newest last: only the top one handles Tab and Escape
const stack = [];

// While `active`: moves focus into `ref` (the element with data-autofocus, else the
// first focusable one), keeps Tab / Shift+Tab inside it, calls onEscape on Escape,
// and gives focus back to whatever had it before when it closes.
export default function useFocusTrap(ref, active, onEscape) {
    const escapeRef = useRef(onEscape);
    useEffect(() => { escapeRef.current = onEscape; }, [onEscape]);

    useEffect(() => {
        if (!active || !ref.current) return undefined;
        const node = ref.current;
        const token = {};
        stack.push(token);
        const previous = document.activeElement;

        const focusables = () => [...node.querySelectorAll(FOCUSABLE)]
            .filter((el) => el.getClientRects().length > 0);

        // Move focus in once the layer can take it (it may still be becoming visible)
        const focusFirst = () => {
            if (node.contains(document.activeElement)) return;
            const target = node.querySelector('[data-autofocus]') || focusables()[0] || node;
            target.focus({ preventScroll: true });
        };
        const frame = requestAnimationFrame(focusFirst);
        const retry = setTimeout(focusFirst, 80);

        function onKeyDown(e) {
            if (stack[stack.length - 1] !== token) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                escapeRef.current?.();
                return;
            }
            if (e.key !== 'Tab') return;
            const list = focusables();
            if (list.length === 0) {
                e.preventDefault();
                node.focus();
                return;
            }
            const first = list[0];
            const last = list[list.length - 1];
            if (e.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) {
                e.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', onKeyDown);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(retry);
            document.removeEventListener('keydown', onKeyDown);
            stack.splice(stack.indexOf(token), 1);
            if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
                previous.focus({ preventScroll: true });
            }
        };
    }, [active, ref]);
}
