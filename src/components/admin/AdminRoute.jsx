import React from 'react';
import RequireAuth, { FullPageSpinner } from '../RequireAuth';

export { FullPageSpinner };

// Only signed-in admins get past this. It only decides what the browser shows:
// every /api/admin request is checked again on the server.
export default function AdminRoute({ children }) {
  return <RequireAuth role="admin" fullScreen>{children}</RequireAuth>;
}
