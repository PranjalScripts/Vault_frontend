import catalog from "./catalog.json";

export type Logo = { id: string; title: string; color: string; uri: string; monochrome?: boolean };
export type LogoKind = "subject" | "platform";
// Keep language punctuation meaningful: C, C++ and C# must remain different.
export const normalizeLogoName = (name: string) => name.normalize("NFKC").toLowerCase().trim().replace(/[\s._-]+/g, "");
const brands = new Map<string, Logo>();
const development = new Map<string, Logo>();
function register(map: Map<string, Logo>, logo: Logo, names: string[]) {
  for (const name of names) {
    const key = normalizeLogoName(name);
    if (key && !map.has(key)) map.set(key, logo);
  }
}
for (const [slug, title, hex] of catalog.simple) {
  register(brands, { id: `simple:${slug}`, title, color: `#${hex}`, uri: `https://cdn.jsdelivr.net/npm/simple-icons@${catalog.simpleIconsVersion}/icons/${slug}.svg`, monochrome: true }, [slug, title]);
}
for (const entry of catalog.devicon) {
  const [slug, color, variant, aliases] = entry as [string, string, string, string[]];
  register(development, { id: `devicon:${slug}`, title: slug, color, uri: `https://cdn.jsdelivr.net/gh/devicons/devicon@${catalog.deviconVersion}/icons/${slug}/${slug}-${variant}.svg` }, [slug, ...aliases]);
}
// These brands are absent from the current catalog; retain verified, pinned assets.
for (const [slug, title, color, version] of [
  ["amazon", "Amazon", "#FF9900", "14.15.0"],
  ["microsoft", "Microsoft", "#737373", "11.15.0"],
  ["openai", "OpenAI", "#412991", "14.15.0"],
]) {
  register(brands, { id: `simple:${slug}`, title, color, monochrome: true, uri: `https://cdn.jsdelivr.net/npm/simple-icons@${version}/icons/${slug}.svg` }, [slug]);
}
const aliases: Record<string, string> = {
  js: "javascript", ts: "typescript", "reactjs": "react", "reactnative": "react",
  "node": "nodedotjs", "nodejs": "nodedotjs", "nextjs": "nextdotjs", "vuejs": "vuedotjs",
  "springframework": "spring", "springboot": "springboot", "py": "python",
  "c#": "csharp", "c++": "cplusplus", "cpp": "cplusplus", "csharp": "csharp",
  "dotnet": "dotnet", "net": "dotnet", "aws": "amazonwebservices",
  "insta": "instagram", "fb": "facebook", "linked": "linkedin",
  "chatgpt": "openai", "ms": "microsoft", "microsoft365": "microsoft",
  "office365": "microsoft", "outlook": "microsoft", "hotmail": "microsoft",
  "googlemail": "gmail", "gdrive": "googledrive", "yt": "youtube",
};
const domains: Record<string, string> = {
  "google.com": "google", "gmail.com": "gmail", "mail.google.com": "gmail",
  "drive.google.com": "googledrive", "docs.google.com": "googledocs",
  "github.com": "github", "gitlab.com": "gitlab", "bitbucket.org": "bitbucket",
  "instagram.com": "instagram", "facebook.com": "facebook", "linkedin.com": "linkedin",
  "x.com": "x", "twitter.com": "twitter", "youtube.com": "youtube", "youtu.be": "youtube",
  "amazon.com": "amazon", "amazon.in": "amazon", "aws.amazon.com": "amazonwebservices",
  "netflix.com": "netflix", "spotify.com": "spotify", "discord.com": "discord",
  "slack.com": "slack", "notion.so": "notion", "notion.com": "notion",
  "microsoft.com": "microsoft", "live.com": "microsoft", "outlook.com": "microsoft",
  "office.com": "microsoft", "apple.com": "apple", "icloud.com": "icloud",
  "openai.com": "openai", "chatgpt.com": "openai", "claude.ai": "claude",
  "reddit.com": "reddit", "pinterest.com": "pinterest", "tiktok.com": "tiktok",
  "whatsapp.com": "whatsapp", "telegram.org": "telegram", "figma.com": "figma",
  "canva.com": "canva", "dropbox.com": "dropbox", "paypal.com": "paypal",
  "zoom.us": "zoom", "stackoverflow.com": "stackoverflow", "leetcode.com": "leetcode",
};
function lookup(name: string, kind: LogoKind): Logo | null {
  const key = normalizeLogoName(name);
  const target = aliases[key] || key;
  // Devicon supplies colored programming logos, including Java; Spring Boot has its own brand.
  if (kind === "subject") return development.get(target) || brands.get(target) || null;
  return brands.get(target) || development.get(target) || null;
}
function platformDomain(name: string): { isDomain: boolean; brand?: string } {
  const value = name.trim();
  const isDomain = /^https?:\/\//i.test(value) || /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#]|$)/i.test(value);
  if (!isDomain) return { isDomain: false };
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.username || url.password) return { isDomain: true };
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    // Most-specific registered domain wins; never infer a brand from a URL path.
    const domain = Object.keys(domains).sort((a, b) => b.length - a.length).find(d => host === d || host.endsWith(`.${d}`));
    return { isDomain: true, brand: domain ? domains[domain] : undefined };
  } catch { return { isDomain: true }; }
}
export function resolveLogo(name: string, kind: LogoKind = "subject"): Logo | null {
  if (!name?.trim()) return null;
  if (kind === "platform") {
    const domain = platformDomain(name);
    if (domain.isDomain) return domain.brand ? lookup(domain.brand, kind) : null;
  }
  const exact = lookup(name, kind);
  if (exact) return exact;
  // Only allow explicit course/account qualifiers, never arbitrary substring/fuzzy matches.
  const cleaned = kind === "subject"
    ? name.trim().replace(/^(?:learn|learning|advanced|core|intro(?:duction)?\s+to)\s+/i, "").replace(/\s+(?:basics|fundamentals|course|notes|tutorials?|programming|development|interview(?:\s+prep)?|\d+(?:\.\d+)*)$/i, "")
    : name.trim().replace(/\s*(?:\((?:personal|work|business)\)|[-–:]?\s+(?:personal|work|business)(?:\s+account)?|\s+account)$/i, "");
  return cleaned !== name.trim() ? lookup(cleaned, kind) : null;
}
export function logoInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words.length > 1 ? `${Array.from(words[0])[0]}${Array.from(words[1])[0]}` : Array.from(words[0]).slice(0, 2).join("")).toUpperCase();
}
