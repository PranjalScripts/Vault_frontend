// Use the same public origin for shared URLs and Android's verified links.
module.exports = ({ config }) => {
  const origin = process.env.EXPO_PUBLIC_WEB_URL;
  const url = origin ? new URL(origin) : null;
  const intentFilters = url?.protocol === 'https:' ? [{
    action: 'VIEW',
    autoVerify: true,
    category: ['BROWSABLE', 'DEFAULT'],
    data: ['/share', '/puzzles/', '/games/puzzles/'].map(pathPrefix => ({
      scheme: 'https', host: url.hostname, pathPrefix,
    })),
  }] : [];
  // Local APKs use the LAN API; HTTPS production builds keep cleartext disabled.
  const usesCleartextTraffic = process.env.EXPO_PUBLIC_API_URL?.startsWith('http://') || false;
  const plugins = (config.plugins || []).map(plugin => Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
    ? [plugin[0], { ...plugin[1], android: { ...plugin[1]?.android, usesCleartextTraffic } }]
    : plugin);
  return { ...config, plugins, android: { ...config.android, intentFilters } };
};
