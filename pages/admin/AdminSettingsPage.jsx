import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save, KeyRound, ShieldCheck, LogOut } from "lucide-react";
import api, { API_URL, getErrorMessage } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { PageHeader, Panel, Field, StatusBadge } from "../../src/components/admin/AdminUI";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 8; // same rule as the backend

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

function ProfileForm() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: user?.email || "", phone: user?.phone || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = form.email !== (user?.email || "") || form.phone !== (user?.phone || "");

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = "Enter a valid email address.";
    if (form.phone.trim() && !/^[+\d][\d\s()./-]{3,29}$/.test(form.phone.trim())) found.phone = "Enter a valid phone number.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await api.patch("/api/auth/me", { email: form.email.trim(), phone: form.phone.trim() });
      updateUser(res.data.user);
      setForm({ email: res.data.user.email || "", phone: res.data.user.phone || "" });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Profile" description="How the store can reach you.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <Field label="Username" hint="Used to sign in. It can't be changed here.">
          <input value={user?.username || ""} readOnly className="input bg-slate-50 text-slate-500" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" required error={errors.email}>
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input" placeholder="Optional" />
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save profile
          </button>
        </div>
      </form>
    </Panel>
  );
}

function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: "", newPassword: "", confirm: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = "Enter your current password.";
    if (form.newPassword.length < MIN_PASSWORD) found.newPassword = `At least ${MIN_PASSWORD} characters.`;
    else if (form.newPassword === form.currentPassword) found.newPassword = "Choose a password you aren't using now.";
    if (form.confirm !== form.newPassword) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await api.post("/api/auth/resetPassword", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      toast.success("Password changed");
    } catch (err) {
      const message = getErrorMessage(err);
      if (/current password/i.test(message)) setErrors({ currentPassword: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Password" description="Use a long password you don't use anywhere else.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <Field label="Current password" required error={errors.currentPassword}>
          <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set("currentPassword")} className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" required error={errors.newPassword} hint={`At least ${MIN_PASSWORD} characters.`}>
            <input type="password" autoComplete="new-password" value={form.newPassword} onChange={set("newPassword")} className="input" />
          </Field>
          <Field label="Repeat new password" required error={errors.confirm}>
            <input type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} className="input" />
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
            Change password
          </button>
        </div>
      </form>
    </Panel>
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
