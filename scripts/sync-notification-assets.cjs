const { copyFileSync, existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');

// RemoteViews needs an Android resource, not a Metro asset URI.
const root = path.resolve(__dirname, '..');
const moduleRoot = path.dirname(require.resolve('expo-notifications/package.json'));
const resources = path.join(moduleRoot, 'android/src/main/res/drawable-nodpi');
const source = path.join(root, 'assets/images/adaptive-icon.png');
if (!existsSync(source)) {
  throw new Error('Missing assets/images/adaptive-icon.png. Include this tracked asset in the EAS build upload.');
}
mkdirSync(resources, { recursive: true });
copyFileSync(
  source,
  path.join(resources, 'vault_notification_logo.png'),
);
console.log('Synced notification artwork from assets/images/adaptive-icon.png');
