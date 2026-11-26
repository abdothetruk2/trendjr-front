import { Flame, Clock3 } from "lucide-react";
import ProductGrid from "../src/components/ProductGrid";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

// Real offers: products with a discount, biggest discount first
export default function OffersPage() {
  const { t } = useLanguage();
  usePageMeta({ title: t("offers.metaTitle"), description: t("offers.text") });
  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <section className="relative overflow-hidden rounded-3xl bg-primary-500 px-7 py-12 text-white sm:px-12">
          <div className="absolute -end-10 -top-16 h-64 w-64 rounded-full border-[34px] border-white/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-extrabold">
              <Flame size={15} /> {t("offers.badge")}
            </span>
            <h1 className="mt-4 max-w-xl text-4xl font-black sm:text-5xl">{t("offers.title")}</h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-primary-50">
              {t("offers.text")}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-primary-600">
              <Clock3 size={17} /> {t("offers.limited")}
            </div>
          </div>
        </section>
        <div className="mb-1 mt-10 flex items-end justify-between">
          <div>
            <p className="eyebrow">{t("offers.eyebrow")}</p>
            <h2 className="mt-2 text-2xl font-black text-secondary">{t("offers.best")}</h2>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700">{t("offers.special")}</span>
        </div>
      </div>
      <ProductGrid id="offers" discounted defaultSort="discount" />
    </main>
  );
}
