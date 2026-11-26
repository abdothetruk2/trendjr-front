import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import { API_URL } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import { PageHeader, Panel, StatusBadge } from "../../src/components/admin/AdminUI";
import { ProfileForm, PasswordForm } from "../../src/components/account/AccountForms";
import useLanguage from "../../src/i18n/useLanguage";
import LanguageSwitcher from "../../src/components/LanguageSwitcher";

export default function AdminSettingsPage() {
  const { t } = useLanguage("admin");
  return (
    <div className="max-w-3xl">
      <PageHeader title={t("layout.nav.settings")} description={t("settings.intro")} />
      <div className="space-y-6">
        <Panel title={t("language.label")} description={t("settings.languageText")} bodyClassName="p-5">
          <LanguageSwitcher variant="list" className="max-w-md" />
        </Panel>
        <ProfileForm />
        <PasswordForm />
        <SessionPanel />
      </div>
    </div>
  );
}

function SessionPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage("admin");
  const remembered = typeof localStorage !== "undefined" && Boolean(localStorage.getItem("trendjr_token"));

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  return (
    <Panel title={t("settings.session")}>
      <dl className="divide-y divide-slate-100 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <dt className="text-slate-500">{t("settings.role")}</dt>
          <dd><StatusBadge kind="role" status={user?.role} /></dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <dt className="text-slate-500">{t("settings.device")}</dt>
          <dd className="font-semibold text-slate-800">{remembered ? t("settings.remembered") : t("settings.tabOnly")}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <dt className="text-slate-500">{t("settings.api")}</dt>
          <dd className="font-mono text-xs text-slate-700" dir="ltr">{API_URL}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          {t("settings.serverChecks")}
        </p>
        <button type="button" onClick={handleSignOut} className="btn-outline btn-sm text-rose-600">
          <LogOut className="h-4 w-4" aria-hidden="true" /> {t("nav.signOut")}
        </button>
      </div>
    </Panel>
  );
}
