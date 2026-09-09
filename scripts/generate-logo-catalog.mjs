// Run after deliberately upgrading the pinned icon packages / Devicon version.
import * as icons from 'simple-icons';
import { writeFile, readFile } from 'node:fs/promises';
const version = JSON.parse(await readFile(new URL('../node_modules/simple-icons/package.json', import.meta.url))).version;
const deviconVersion = 'v2.17.0';
const response = await fetch(`https://cdn.jsdelivr.net/gh/devicons/devicon@${deviconVersion}/devicon.json`);
if (!response.ok) throw new Error(`Devicon catalog: ${response.status}`);
const devicons = await response.json();
const catalog = {
  simpleIconsVersion: version,
  deviconVersion,
  simple: Object.values(icons).map(({ slug, title, hex }) => [slug, title, hex]),
  devicon: devicons.map(({ name, altnames, color, versions }) => [name, color, ['original', 'plain', 'line', 'original-wordmark', 'plain-wordmark'].find(v => versions.svg.includes(v)) || versions.svg[0], altnames]),
};
await writeFile(new URL('../src/utils/logos/catalog.json', import.meta.url), JSON.stringify(catalog));
console.log(`Generated ${catalog.simple.length} brand and ${catalog.devicon.length} development logo entries.`);
