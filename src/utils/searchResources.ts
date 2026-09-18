export type SearchResource = { label: string; url: string; isFile: boolean };
export function topicResources(topic: { url?: string; files?: { fileName: string; fileUrl: string }[] }): SearchResource[] {
  const resources: SearchResource[] = [];
  const add = (value: string | undefined, label: string, isFile: boolean) => {
    if (!value?.trim()) return;
    try {
      const url = new URL(value.trim());
      if (!["https:", "http:"].includes(url.protocol)) return;
      resources.push({ label, url: url.href, isFile });
    } catch { /* Invalid stored links should never be launched. */ }
  };
  add(topic.url, "Open link", false);
  for (const file of topic.files || []) add(file.fileUrl, file.fileName || "Open file", true);
  return resources;
}
export function primaryResource(resources: SearchResource[], term: string) {
  const query = term.trim().toLowerCase();
  return (query && resources.find(resource => resource.isFile && resource.label.toLowerCase().includes(query))) || resources[0];
}
