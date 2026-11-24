import React from 'react';

// Title row used by the homepage sections: small eyebrow, heading, optional action link
export default function SectionHeader({ eyebrow, title, action = null, id }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-primary-600">{eyebrow}</p>}
        <h2 id={id} className="mt-1 text-xl font-black tracking-tight text-secondary sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
