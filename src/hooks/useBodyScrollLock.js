import { useEffect } from 'react';

// Stops the page behind an open drawer/dialog from scrolling.
// Several open layers share one lock: the page unlocks when the last one closes.
let locks = 0;
let saved = null;

export default function useBodyScrollLock(locked) {
    useEffect(() => {
        if (!locked) return undefined;
        const { body, documentElement } = document;

        if (locks === 0) {
            // Keep the layout from jumping when the scrollbar disappears
            const scrollbar = window.innerWidth - documentElement.clientWidth;
            saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
            body.style.overflow = 'hidden';
            if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
        }
        locks += 1;

        return () => {
            locks -= 1;
            if (locks === 0 && saved) {
                body.style.overflow = saved.overflow;
                body.style.paddingRight = saved.paddingRight;
                saved = null;
            }
        };
    }, [locked]);
}
