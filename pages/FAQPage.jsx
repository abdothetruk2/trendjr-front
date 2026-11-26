import { Link } from "react-router-dom";
import { Trans } from "react-i18next";
import { CircleHelp, Truck, CreditCard, RotateCcw, PackageCheck } from "lucide-react";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

// Questions per section; the texts live in locales/<lang>/common.json under faq.*
// (<orders>…</orders> and <contact>…</contact> in an answer become links)
const SECTIONS = [
  { id: "shipping", icon: Truck, questions: ["cost", "time", "track"] },
  { id: "payments", icon: CreditCard, questions: ["methods", "coupon", "safe"] },
  { id: "returns", icon: RotateCcw, questions: ["request", "refund"] },
  { id: "orders", icon: PackageCheck, questions: ["change"] },
];

const LINKS = {
  orders: <Link to="/orders" className="font-bold text-primary-600" />,
  contact: <Link to="/contact" className="font-bold text-primary-600" />,
};

function Question({ q, children, open = false }) {
  return (
    <details className="border-t border-slate-100 py-4" open={open}>
      <summary className="cursor-pointer text-sm font-bold text-secondary">{q}</summary>
      <div className="mt-3 text-sm leading-7 text-slate-500">{children}</div>
    </details>
  );
}

function Section({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="card scroll-mt-28 p-5" aria-labelledby={`${id}-title`}>
      <div className="mb-4 flex items-center gap-3">
        <Icon className="text-primary-500" aria-hidden="true" />
        <h2 id={`${id}-title`} className="font-extrabold text-secondary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function FAQPage() {
  const { t } = useLanguage();
  usePageMeta({ title: t("faq.title"), description: t("faq.text") });
  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600"><CircleHelp size={28} aria-hidden="true" /></span>
          <p className="eyebrow mt-5">{t("faq.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-secondary sm:text-4xl">{t("faq.title")}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">{t("faq.text")}</p>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          {SECTIONS.map((section) => (
            <Section key={section.id} id={section.id} icon={section.icon} title={t(`faq.${section.id}.title`)}>
              {section.questions.map((q, i) => (
                <Question key={q} q={t(`faq.${section.id}.${q}.q`)} open={i === 0 && section.id !== "orders"}>
                  <Trans i18nKey={`faq.${section.id}.${q}.a`} components={LINKS} />
                </Question>
              ))}
            </Section>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          <Trans i18nKey="faq.stillNeedHelp" components={LINKS} />
        </p>
      </div>
    </main>
  );
}
