import React, { useState } from 'react';
import { Loader2, Save, KeyRound, MapPin } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Panel, Field } from '../admin/AdminUI';
import useLanguage from '../../i18n/useLanguage';

// Account forms shared by the customer profile page and the admin settings page.

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^[+\d][\d\s()./-]{3,29}$/;
const MIN_PASSWORD = 8; // same rule as the backend

export function ProfileForm({ title, description }) {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: user?.email || '', phone: user?.phone || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = form.email !== (user?.email || '') || form.phone !== (user?.phone || '');

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = t('account.emailInvalid');
    if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) found.phone = t('account.phoneInvalid');
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await api.patch('/api/auth/me', { email: form.email.trim(), phone: form.phone.trim() });
      updateUser(res.data.user);
      setForm({ email: res.data.user.email || '', phone: res.data.user.phone || '' });
      toast.success(t('account.profileUpdated'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={title || t('account.profile')} description={description || t('account.profileText')}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <Field label={t('account.username')} hint={t('account.usernameHint')}>
          <input value={user?.username || ''} readOnly className="input bg-slate-50 text-slate-500" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('account.email')} required error={errors.email}>
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input" />
          </Field>
          <Field label={t('account.phone')} error={errors.phone}>
            <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input" placeholder={t('account.optional')} />
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {t('account.saveProfile')}
          </button>
        </div>
      </form>
    </Panel>
  );
}

// The saved delivery address (pre-fills checkout)
export function AddressForm() {
  const { t } = useLanguage();
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
      toast.success(t('account.addressSaved'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={t('account.address')} description={t('account.addressText')}>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label={t('address.fullName')}>
          <input value={form.fullName} onChange={set('fullName')} autoComplete="name" className="input" maxLength={100} />
        </Field>
        <Field label={t('account.phone')}>
          <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" className="input" maxLength={30} />
        </Field>
        <Field label={t('address.street')} className="sm:col-span-2">
          <input value={form.street} onChange={set('street')} autoComplete="street-address" className="input" maxLength={200} placeholder={t('address.streetPlaceholder')} />
        </Field>
        <Field label={t('address.city')}>
          <input value={form.city} onChange={set('city')} autoComplete="address-level2" className="input" maxLength={100} />
        </Field>
        <Field label={t('address.postalCode')}>
          <input value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" className="input" maxLength={20} />
        </Field>
        <Field label={t('address.country')} className="sm:col-span-2">
          <input value={form.country} onChange={set('country')} autoComplete="country-name" className="input" maxLength={60} />
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
            {t('account.saveAddress')}
          </button>
        </div>
      </form>
    </Panel>
  );
}

export function PasswordForm() {
  const { t } = useLanguage();
  const toast = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = t('account.currentRequired');
    if (form.newPassword.length < MIN_PASSWORD) found.newPassword = t('account.minChars', { count: MIN_PASSWORD });
    else if (form.newPassword === form.currentPassword) found.newPassword = t('account.differentPassword');
    if (form.confirm !== form.newPassword) found.confirm = t('account.mismatch');
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await api.post('/api/auth/resetPassword', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      toast.success(t('account.passwordChanged'));
    } catch (err) {
      const message = getErrorMessage(err);
      if (/current password/i.test(err?.response?.data?.message || '')) setErrors({ currentPassword: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={t('account.password')} description={t('account.passwordText')}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <Field label={t('account.currentPassword')} required error={errors.currentPassword}>
          <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('account.newPassword')} required error={errors.newPassword} hint={t('account.minChars', { count: MIN_PASSWORD })}>
            <input type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} className="input" />
          </Field>
          <Field label={t('account.repeatPassword')} required error={errors.confirm}>
            <input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} className="input" />
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
            {t('account.changePassword')}
          </button>
        </div>
      </form>
    </Panel>
  );
}
