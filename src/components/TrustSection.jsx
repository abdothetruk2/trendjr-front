import React from 'react';
import { Globe2, ShieldCheck, PackageCheck, Headphones } from 'lucide-react';
import useLanguage from '../i18n/useLanguage';

const PILLARS = [
  {
    icon: Globe2,
    key: 'delivery',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: PackageCheck,
    key: 'qc',
    color: 'text-primary-600 bg-primary-50',
  },
  {
    icon: ShieldCheck,
    key: 'protection',
    color: 'text-sky-600 bg-sky-50',
  },
  {
    icon: Headphones,
    key: 'support',
    color: 'text-violet-600 bg-violet-50',
  },
];

export default function TrustSection() {
  const { t } = useLanguage();
  return (
    <section className="container-page py-8">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <span className="eyebrow text-xs font-extrabold tracking-wider text-primary-600">
              {t('trust.eyebrow')}
            </span>
            <h2 className="heading text-xl sm:text-2xl text-slate-950 mt-1">
              {t('trust.title')}
            </h2>
          </div>
          <p className="text-muted max-w-sm">
            {t('trust.text')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className={`icon-box w-10 h-10 mb-3.5 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="heading text-sm">{t(`trust.${item.key}.title`)}</h3>
                <p className="text-muted mt-1.5 leading-relaxed">{t(`trust.${item.key}.text`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
