import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'
import "./index.css" // Tailwind + theme, loaded once for every page
import i18n, { i18nReady, applyDocumentLanguage } from './i18n';
import { initCurrency } from './currency';

// Render once the visitor's language (and only that language) has loaded
// Render once the visitor's language and currency are known (both cached after the first visit)
Promise.allSettled([i18nReady, initCurrency()]).finally(() => {
  applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);

  // A ?lang= link has done its job (the choice is saved): keep the URL clean
  const url = new URL(window.location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
