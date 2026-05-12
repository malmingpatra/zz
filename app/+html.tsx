import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        
        {/* PWA Tags */}
        <title>Warung POS</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A6B3C" />
        <link rel="apple-touch-icon" href="/pwa-icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/pwa-icon.svg" />
        
        <ScrollViewStyleReset />

        {/* Sembunyikan URL path */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function forceRoot() {
                if (window.location.pathname !== '/') {
                  window.history.replaceState(null, '', '/');
                }
              }

              // Override pushState dan replaceState
              var _push = history.pushState.bind(history);
              var _replace = history.replaceState.bind(history);
              history.pushState = function(state, title, url) {
                _push(state, title, '/');
              };
              history.replaceState = function(state, title, url) {
                _replace(state, title, '/');
              };

              // Tangkap juga tombol back/forward browser
              window.addEventListener('popstate', forceRoot);

              // Jalankan terus setiap 100ms sebagai fallback
              setInterval(forceRoot, 100);
            })();
          `
        }} />

        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('SW registered: ', registration);
                }).catch(function(registrationError) {
                  console.log('SW registration failed: ', registrationError);
                });
              });
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
