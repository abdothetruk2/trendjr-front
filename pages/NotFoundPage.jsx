import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

export default function NotFoundPage() {
  const { t } = useLanguage();
  usePageMeta({ title: t("notFound.title") });
  return (
    <main className="min-h-[60vh] bg-surface py-16">
      <div className="container-page">
        <div className="card mx-auto max-w-lg p-8 text-center sm:p-10">
          <SearchX className="mx-auto h-12 w-12 text-primary-400" aria-hidden="true" />
          <p className="eyebrow mt-4">{t("notFound.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-black text-secondary">{t("notFound.title")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("notFound.text")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">
              <Home size={17} /> {t("notFound.home")}
            </Link>
            <Link to="/shop" className="btn-outline">
              {t("notFound.browse")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
