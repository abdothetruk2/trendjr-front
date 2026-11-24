import React, { useState } from 'react';
import { Loader2, Save, KeyRound, MapPin } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Panel, Field } from '../admin/AdminUI';

// Account forms shared by the customer profile page and the admin settings page.

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^[+\d][\d\s()./-]{3,29}$/;
const MIN_PASSWORD = 8; // same rule as the backend

export function ProfileForm({ title = 'Profile', description = 'How the store can reach you.' }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: user?.email || '', phone: user?.phone || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = form.email !== (user?.email || '') || form.phone !== (user?.phone || '');

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = 'Enter a valid email address.';
    if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) found.phone = 'Enter a valid phone number.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await api.patch('/api/auth/me', { email: form.email.trim(), phone: form.phone.trim() });
      updateUser(res.data.user);
      setForm({ email: res.data.user.email || '', phone: res.data.user.phone || '' });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={title} description={description}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <Field label="Username" hint="Used to sign in. It can't be changed here.">
          <input value={user?.username || ''} readOnly className="input bg-slate-50 text-slate-500" />
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

// The saved delivery address (pre-fills checkout)
export function AddressForm() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const saved = user?.addresses?.[0] || {};
  const initial = {
    fullName: saved.fullName || '',
    phone: saved.phone || '',
    street: saved.street || '',
    city: saved.city || '',
    postalCode: saved.postalCode || '',
    country: saved.country || '',
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const address = Object.fromEntries(Object.entries(form).map(([k, val]) => [k, val.trim()]));
      const res = await api.patch('/api/auth/me', { address });
      updateUser(res.data.user);
      toast.success('Delivery address saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Delivery address" description="Used to fill in checkout for you.">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Full name">
          <input value={form.fullName} onChange={set('fullName')} autoComplete="name" className="input" maxLength={100} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" className="input" maxLength={30} />
        </Field>
        <Field label="Street address" className="sm:col-span-2">
          <input value={form.street} onChange={set('street')} autoComplete="street-address" className="input" maxLength={200} placeholder="Street, building, apartment" />
        </Field>
        <Field label="City">
          <input value={form.city} onChange={set('city')} autoComplete="address-level2" className="input" maxLength={100} />
        </Field>
        <Field label="Postal code">
          <input value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" className="input" maxLength={20} />
        </Field>
        <Field label="Country" className="sm:col-span-2">
          <input value={form.country} onChange={set('country')} autoComplete="country-name" className="input" maxLength={60} />
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
            Save address
          </button>
        </div>
      </form>
    </Panel>
  );
}

export function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = 'Enter your current password.';
    if (form.newPassword.length < MIN_PASSWORD) found.newPassword = `At least ${MIN_PASSWORD} characters.`;
    else if (form.newPassword === form.currentPassword) found.newPassword = "Choose a password you aren't using now.";
    if (form.confirm !== form.newPassword) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await api.post('/api/auth/resetPassword', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      toast.success('Password changed');
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
          <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" required error={errors.newPassword} hint={`At least ${MIN_PASSWORD} characters.`}>
            <input type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} className="input" />
          </Field>
          <Field label="Repeat new password" required error={errors.confirm}>
            <input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} className="input" />
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
