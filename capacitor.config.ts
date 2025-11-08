import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.invitationqr.app',
  appName: 'Invitation QR App',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    buildOptions: {
      keystorePath: 'keystore.jks',
      keystorePassword: 'invitationqr2024',
      keystoreAlias: 'invitationqr',
      keystoreAliasPassword: 'invitationqr2024'
    }
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      permissions: ['storage']
    }
  }
};

export default config;
