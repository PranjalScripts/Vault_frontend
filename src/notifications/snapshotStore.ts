import * as SecureStore from "expo-secure-store";

type Manifest = { version: 1; slot: number; count: number };
function manifest(raw: string | null): Manifest | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value?.version === 1 && [0, 1].includes(value.slot) && Number.isInteger(value.count) && value.count > 0 && value.count <= 10000 ? value : null;
  } catch { return null; }
}

export async function readSnapshotValue(key: string): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(key);
  const head = manifest(raw);
  if (!head) return raw;
  const chunks: string[] = [];
  for (let index = 0; index < head.count; index++) {
    const chunk = await SecureStore.getItemAsync(`${key}-${head.slot}-${index}`);
    if (chunk === null) return null;
    chunks.push(chunk);
  }
  return chunks.join("");
}

// Calls are serialized by the reminder service. Write the inactive bank first,
// then commit its manifest so an interrupted save preserves the previous data.
export async function writeSnapshotValue(key: string, value: string) {
  const previous = manifest(await SecureStore.getItemAsync(key));
  const slot = previous?.slot === 0 ? 1 : 0;
  const chunks: string[] = [];
  let chunk = "";
  for (const character of value) {
    // At most 1,200 UTF-8 bytes, without splitting a surrogate pair.
    if (chunk.length + character.length > 400) { chunks.push(chunk); chunk = ""; }
    chunk += character;
  }
  chunks.push(chunk);
  if (chunks.length > 10000) throw new Error("Reminder snapshot is too large.");
  for (let index = 0; index < chunks.length; index++) {
    await SecureStore.setItemAsync(`${key}-${slot}-${index}`, chunks[index]);
  }
  await SecureStore.setItemAsync(key, JSON.stringify({ version: 1, slot, count: chunks.length }));
  if (previous) {
    for (let index = 0; index < previous.count; index++) {
      await SecureStore.deleteItemAsync(`${key}-${previous.slot}-${index}`).catch(() => {});
    }
  }
}
