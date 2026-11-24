import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500">
        <Loader2 className="h-7 w-7 animate-spin text-primary-500" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}

// Only signed-in admins get past this. It only decides what the browser shows:
// every /api/admin request is checked again on the server.
export default function AdminRoute({ children }) {
  const { user, checking, logout } = useAuth();
  const location = useLocation();

  if (checking) return <FullPageSpinner label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (user.role !== 'admin') {
    return (
      <main className="grid min-h-screen place-items-center bg-surface px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-black text-secondary">Admins only</h1>
          <p className="mt-2 text-sm text-slate-500">
            You&apos;re signed in as <strong>{user.username || user.email}</strong>, which doesn&apos;t have access to the dashboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">Back to the store</Link>
            <button type="button" onClick={logout} className="btn-outline">Use another account</button>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
