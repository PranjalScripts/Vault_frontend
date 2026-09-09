/* global __dirname */
// Update only Expo's splash mods in existing native projects. Launcher icon mods,
// app identifiers, auth plugins and dependencies are deliberately not evaluated.
const fs = require("node:fs");
const path = require("node:path");
const { compileModsAsync } = require("expo/config-plugins");
const withSplashScreen = require("expo-splash-screen/app.plugin").default;
const root = path.resolve(__dirname, "..");
const { expo } = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const entry = expo.plugins.find(item => Array.isArray(item) && item[0] === "expo-splash-screen");
const platforms = ["android", "ios"].filter(platform => fs.existsSync(path.join(root, platform)));
if (!entry || !platforms.length) {
  throw new Error("No existing native project or splash config. Run npx expo prebuild first.");
}
compileModsAsync(withSplashScreen({ ...expo, _internal: { projectRoot: root } }, entry[1]), { projectRoot: root, platforms })
  .then(() => console.log(`Updated native splash resources: ${platforms.join(", ")}. A native rebuild is still required.`))
  .catch(error => { console.error(error); process.exitCode = 1; });
