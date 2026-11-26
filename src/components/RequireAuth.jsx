import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useLanguage from '../i18n/useLanguage';
import i18n from '../i18n';

export function FullPageSpinner({ label, fullScreen = true }) {
  return (
    <div className={`grid place-items-center bg-surface ${fullScreen ? 'min-h-screen' : 'min-h-[50vh]'}`} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500">
        <Loader2 className="h-7 w-7 animate-spin text-primary-500" aria-hidden="true" />
        {label || i18n.t('common.loading')}
      </div>
    </div>
  );
}

// Shows `children` only to signed-in users (and, with `role`, only that role).
// Visitors are sent to the login page, which brings them back here afterwards.
// This only decides what the browser shows: the API checks every request again.
export default function RequireAuth({ role, fullScreen = false, children }) {
  const { user, checking, logout } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  if (checking) return <FullPageSpinner label={t('auth.checkingSession')} fullScreen={fullScreen} />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (role && user.role !== role) {
    return (
      <main className={`grid place-items-center bg-surface px-4 ${fullScreen ? 'min-h-screen' : 'min-h-[60vh] py-12'}`}>
        <div className="card w-full max-w-md p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-black text-secondary">{role === 'admin' ? t('auth.adminsOnly') : t('auth.noAccess')}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('auth.signedInAsNoAccess', { name: user.username || user.email })}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">{t('auth.backToStore')}</Link>
            <button type="button" onClick={logout} className="btn-outline">{t('auth.otherAccount')}</button>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
