import { Link } from "react-router-dom";
import { HeartHandshake, ShieldCheck, Sparkles, Users, ArrowRight } from "lucide-react";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

const VALUES = [
  { key: "customer", icon: HeartHandshake },
  { key: "trust", icon: ShieldCheck },
  { key: "discoveries", icon: Sparkles },
];

export default function AboutPage() {
  const { t } = useLanguage();
  usePageMeta({ title: t("about.metaTitle"), description: t("about.text") });
  return (
    <main className="min-h-screen bg-surface py-8"><div className="container-page">
      <section className="relative overflow-hidden rounded-3xl bg-secondary px-7 py-14 text-white sm:px-14 sm:py-20"><div className="absolute -end-14 -top-20 h-80 w-80 rounded-full border-[45px] border-primary-500/20" /><div className="relative max-w-2xl"><p className="eyebrow !text-orange-200">{t("about.eyebrow")}</p><h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{t("about.title")}</h1><p className="mt-5 text-sm leading-8 text-slate-300 sm:text-base">{t("about.text")}</p><Link to="/shop" className="btn-primary mt-7">{t("about.explore")} <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
      <section className="grid gap-5 py-12 md:grid-cols-3">
        {VALUES.map(({ key, icon: Icon }) => (
          <div key={key} className="card p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-600"><Icon /></span><h2 className="mt-5 text-lg font-black text-secondary">{t(`about.values.${key}.title`)}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{t(`about.values.${key}.text`)}</p></div>
        ))}
      </section>
      <section className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 md:grid-cols-2"><div><p className="eyebrow">{t("about.approachEyebrow")}</p><h2 className="mt-2 text-3xl font-black text-secondary">{t("about.approachTitle")}</h2><p className="mt-4 text-sm leading-8 text-slate-500">{t("about.approachText")}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-primary-50 p-5"><Users className="text-primary-600" /><strong className="mt-4 block text-2xl font-black text-secondary">{t("about.customer")}</strong><span className="text-xs text-slate-500">{t("about.focused")}</span></div><div className="rounded-2xl bg-slate-50 p-5"><ShieldCheck className="text-primary-600" /><strong className="mt-4 block text-2xl font-black text-secondary">{t("about.secure")}</strong><span className="text-xs text-slate-500">{t("about.experience")}</span></div></div></section>
    </div></main>
  );
}
