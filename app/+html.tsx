import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every web page during static rendering.
// The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
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
        
        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Sembunyikan URL path */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var _pushState = history.pushState;
              var _replaceState = history.replaceState;
              history.pushState = function() {
                _pushState.apply(history, ['', '', '/']);
              };
              history.replaceState = function() {
                _replaceState.apply(history, ['', '', '/']);
              };
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
