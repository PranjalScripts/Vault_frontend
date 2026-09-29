const { withProjectBuildGradle } = require('expo/config-plugins');
const line = 'apply from: file("../scripts/notification-resources.gradle")';
module.exports = config => withProjectBuildGradle(config, config => {
  if (config.modResults.language !== 'groovy') throw new Error('Vault notification resources require Groovy build.gradle');
  if (!config.modResults.contents.includes(line)) config.modResults.contents += `\n// Lightweight notification artwork, without modifying dependency sources.\n${line}\n`;
  return config;
});
