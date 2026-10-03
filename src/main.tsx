import { Capacitor } from '@capacitor/core';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupNativeChrome } from './app/native';

void setupNativeChrome();

if (!Capacitor.isNativePlatform() && import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
