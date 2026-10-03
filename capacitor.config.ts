import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.makroot.parkradar',
  appName: 'Park Radar',
  webDir: 'dist',
  backgroundColor: '#F1F2F4',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
    Keyboard: {
      resize: 'native',
    },
  },
};

export default config;
