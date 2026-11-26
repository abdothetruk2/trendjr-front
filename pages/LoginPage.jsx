import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, UserRound, LockKeyhole, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../src/context/AuthContext";
import { getErrorMessage } from "../src/services/api";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";
  const { t } = useLanguage();
  usePageMeta({ title: t("login.metaTitle") });

  const [form, setForm] = useState({ username: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={redirectTo} replace />;

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ username: form.username.trim(), password: form.password, remember: form.remember });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-surface px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card md:grid-cols-2">
        <div className="relative hidden min-h-[570px] flex-col justify-between overflow-hidden bg-secondary p-10 text-white md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(160,82,201,0.4),transparent_40%)]" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500"><ShoppingBag /></span>
            <h2 className="mt-8 max-w-xs text-4xl font-black leading-tight">{t("login.sideTitle")}</h2>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-300">{t("login.sideText")}</p>
          </div>
          <p className="relative text-xs text-slate-400">{t("login.sideFooter")}</p>
        </div>

        <div className="p-7 sm:p-12">
          <p className="eyebrow">{t("login.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">{t("login.title")}</h1>
          <p className="mt-3 text-sm text-slate-500">{t("login.intro")}</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
                <AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            <label className="block text-xs font-bold text-slate-600">{t("account.username")}
              <span className="relative mt-2 block">
                <UserRound className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input name="username" value={form.username} onChange={update} required autoComplete="username" className="input ps-10" placeholder={t("login.usernamePlaceholder")} />
              </span>
            </label>
            <label className="block text-xs font-bold text-slate-600">{t("account.password")}
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input name="password" type="password" value={form.password} onChange={update} required autoComplete="current-password" className="input ps-10" placeholder={t("login.passwordPlaceholder")} />
              </span>
            </label>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-500">
                <input name="remember" type="checkbox" checked={form.remember} onChange={update} className="accent-primary" /> {t("login.remember")}
              </label>
              <Link to="/contact" className="font-bold text-primary-600" title={t("login.forgotHint")}>{t("login.forgot")}</Link>
            </div>
            <button type="submit" disabled={submitting || !form.username.trim() || !form.password} className="btn-primary w-full py-3.5">
              {submitting ? <><Loader2 size={17} className="animate-spin" /> {t("login.signingIn")}</> : <>{t("nav.signIn")} <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {t("login.noAccount")} <Link to="/register" state={location.state} className="font-extrabold text-primary-600">{t("login.createOne")}</Link>
          </p>
          <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">{t("login.terms")}</p>
        </div>
      </div>
    </main>
  );
}
