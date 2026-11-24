import React from 'react';
import { Globe2, ShieldCheck, PackageCheck, Headphones } from 'lucide-react';

const PILLARS = [
  {
    icon: Globe2,
    title: 'Worldwide Free Delivery',
    desc: 'Every single order ships free with no minimum basket required and live milestone tracking.',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: PackageCheck,
    title: 'Pre-Shipment QC Check',
    desc: 'Items are sourced directly from vetted workshops and inspected before leaving the warehouse.',
    color: 'text-primary-600 bg-primary-50',
  },
  {
    icon: ShieldCheck,
    title: '100% Buyer Protection',
    desc: 'Encrypted checkout and full hassle-free refunds if an order arrives damaged or undelivered.',
    color: 'text-sky-600 bg-sky-50',
  },
  {
    icon: Headphones,
    title: 'Responsive Support Team',
    desc: 'Real human specialists ready to help with tracking updates, sizing, or returns anytime.',
    color: 'text-violet-600 bg-violet-50',
  },
];

export default function TrustSection() {
  return (
    <section className="container-page py-8">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <span className="eyebrow text-xs font-extrabold tracking-wider text-primary-600">
              Why Choose Trend Jr?
            </span>
            <h2 className="heading text-xl sm:text-2xl text-slate-950 mt-1">
              From Factory to Your Door — Full Transparency
            </h2>
          </div>
          <p className="text-muted max-w-sm">
            Average worldwide delivery in 7–21 days with end-to-end parcel visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className={`icon-box w-10 h-10 mb-3.5 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="heading text-sm">{item.title}</h3>
                <p className="text-muted mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
