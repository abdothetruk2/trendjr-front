import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import { API_URL } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import { PageHeader, Panel, StatusBadge } from "../../src/components/admin/AdminUI";
import { ProfileForm, PasswordForm } from "../../src/components/account/AccountForms";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Your admin account and sign-in details." />
      <div className="space-y-6">
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
  const remembered = typeof localStorage !== "undefined" && Boolean(localStorage.getItem("trendjr_token"));

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  return (
    <Panel title="Session & access">
      <dl className="divide-y divide-slate-100 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <dt className="text-slate-500">Role</dt>
          <dd><StatusBadge kind="role" status={user?.role} /></dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <dt className="text-slate-500">Signed in on this device</dt>
          <dd className="font-semibold text-slate-800">{remembered ? "Remembered (until the session expires)" : "This browser tab only"}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <dt className="text-slate-500">API server</dt>
          <dd className="font-mono text-xs text-slate-700">{API_URL}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          Every admin action is checked by the server against your role, not just by this page.
        </p>
        <button type="button" onClick={handleSignOut} className="btn-outline btn-sm text-rose-600">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </div>
    </Panel>
  );
}
