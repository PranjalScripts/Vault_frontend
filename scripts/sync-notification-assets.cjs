const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

// Validate only. Gradle prepares resources outside node_modules at build time.
const source = path.resolve(__dirname, '../assets/images/notification-icon.png');
if (!existsSync(source)) throw new Error('Missing assets/images/notification-icon.png');
const data = readFileSync(source);
if (!data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    data.readUInt32BE(16) !== 96 || data.readUInt32BE(20) !== 96 ||
    data[24] !== 8 || data[25] !== 6 || data.length > 32768) {
  throw new Error('Notification icon must be a lightweight 96x96, 8-bit RGBA PNG');
}
console.log('Notification icon validated; dependency sources are untouched');
