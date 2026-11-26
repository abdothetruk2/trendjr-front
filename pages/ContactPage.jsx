import { useState } from "react";
import { Mail, Phone, Clock3, Send, MessageCircle } from "lucide-react";
import { SITE } from "../src/config/site";
import { useAuth } from "../src/context/AuthContext";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

const TOPICS = ["order", "product", "shipping", "returns", "selling", "other"];

// The form opens the visitor's email app with the message filled in
// (the store has no email-sending service of its own).
export default function ContactPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  usePageMeta({ title: t("contact.title"), description: t("contact.text") });
  const [form, setForm] = useState({ name: user?.username || "", email: user?.email || "", topic: "", message: "" });
  const [errors, setErrors] = useState({});
  const [opened, setOpened] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = t("contact.nameRequired");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = t("validation.email");
    if (!form.topic) found.topic = t("contact.topicRequired");
    if (form.message.trim().length < 10) found.message = t("contact.messageShort");
    setErrors(found);
    if (Object.keys(found).length) return;

    const subject = `${t(`contact.topics.${form.topic}`)} — ${form.name.trim()}`;
    const body = `${form.message.trim()}\n\n${form.name.trim()}\n${form.email.trim()}`;
    window.location.href = `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  const error = (key) => errors[key] && <span className="mt-1.5 block text-xs font-semibold text-rose-600">{errors[key]}</span>;

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-8">
          <p className="eyebrow">{t("contact.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-secondary sm:text-4xl">{t("contact.title")}</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">{t("contact.text")}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="card p-6 sm:p-8" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title" className="text-xl font-black text-secondary">{t("contact.formTitle")}</h2>
            <p className="mt-2 text-xs text-slate-400">{t("contact.formHint")}</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-600">{t("contact.name")} *
                  <input value={form.name} onChange={set("name")} autoComplete="name" maxLength={100} className="input mt-2" placeholder={t("address.fullName")} aria-invalid={errors.name ? true : undefined} />
                  {error("name")}
                </label>
                <label className="text-xs font-bold text-slate-600">{t("contact.email")} *
                  <input type="email" value={form.email} onChange={set("email")} autoComplete="email" maxLength={254} className="input mt-2" placeholder="you@example.com" aria-invalid={errors.email ? true : undefined} />
                  {error("email")}
                </label>
              </div>
              <label className="block text-xs font-bold text-slate-600">{t("contact.subject")} *
                <select value={form.topic} onChange={set("topic")} className="input mt-2" aria-invalid={errors.topic ? true : undefined}>
                  <option value="">{t("contact.selectTopic")}</option>
                  {TOPICS.map((topic) => <option key={topic} value={topic}>{t(`contact.topics.${topic}`)}</option>)}
                </select>
                {error("topic")}
              </label>
              <label className="block text-xs font-bold text-slate-600">{t("contact.message")} *
                <textarea value={form.message} onChange={set("message")} maxLength={2000} className="input mt-2 min-h-40" placeholder={t("contact.messagePlaceholder")} aria-invalid={errors.message ? true : undefined} />
                {error("message")}
              </label>
              <button type="submit" className="btn-primary px-7 py-3">{t("contact.send")} <Send size={16} aria-hidden="true" /></button>
              {opened && (
                <p className="text-xs text-slate-500" role="status">
                  {t("contact.opened")}{" "}
                  <a href={`mailto:${SITE.supportEmail}`} className="font-bold text-primary-600">{SITE.supportEmail}</a>.
                </p>
              )}
            </form>
          </section>
          <aside className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600"><Mail aria-hidden="true" /></span>
                <div>
                  <p className="text-xs text-slate-400">{t("contact.emailUs")}</p>
                  <a href={`mailto:${SITE.supportEmail}`} className="font-bold text-secondary hover:text-primary-600">{SITE.supportEmail}</a>
                </div>
              </div>
            </div>
            {SITE.supportPhone && (
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600"><Phone aria-hidden="true" /></span>
                  <div>
                    <p className="text-xs text-slate-400">{t("contact.callUs")}</p>
                    <a href={`tel:${SITE.supportPhone.replace(/[^\d+]/g, "")}`} className="font-bold text-secondary hover:text-primary-600" dir="ltr">{SITE.supportPhone}</a>
                  </div>
                </div>
              </div>
            )}
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600"><Clock3 aria-hidden="true" /></span>
                <div>
                  <p className="text-xs text-slate-400">{t("contact.hours")}</p>
                  <p className="font-bold text-secondary">{t("contact.days")}</p>
                  <p className="text-xs text-slate-500">{t("contact.time")}</p>
                </div>
              </div>
            </div>
            {SITE.whatsapp && (
              <div className="rounded-2xl bg-secondary p-5 text-white">
                <MessageCircle className="text-primary-400" aria-hidden="true" />
                <h3 className="mt-3 font-extrabold">{t("contact.quickHelp")}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-300">{t("contact.whatsapp")}</p>
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-200 hover:text-white">
                  {t("contact.chat")} <MessageCircle size={15} aria-hidden="true" />
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
