const { copyFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');

// RemoteViews needs an Android resource, not a Metro asset URI.
const root = path.resolve(__dirname, '..');
const moduleRoot = path.dirname(require.resolve('expo-notifications/package.json'));
const resources = path.join(moduleRoot, 'android/src/main/res/drawable-nodpi');
mkdirSync(resources, { recursive: true });
copyFileSync(
  path.join(root, 'assets/images/notification logo.png'),
  path.join(resources, 'vault_notification_logo.png'),
);
