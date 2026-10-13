function isValidUpdateMetadata(value) {
  if (!value || typeof value !== 'object') return false;
  let apk;
  try { apk = new URL(value.apkUrl); } catch { return false; }
  return Number.isSafeInteger(value.latestVersionCode) && value.latestVersionCode > 0
    && Number.isSafeInteger(value.minimumSupportedVersionCode ?? 0) && (value.minimumSupportedVersionCode ?? 0) >= 0
    && (value.minimumSupportedVersionCode ?? 0) <= value.latestVersionCode
    && typeof value.latestVersion === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value.latestVersion)
    && apk.protocol === 'https:' && typeof value.releaseNotes === 'string'
    && typeof value.mandatory === 'boolean';
}

function decideUpdate(installedCode, metadata) {
  if (!Number.isSafeInteger(installedCode) || installedCode < 1 || !isValidUpdateMetadata(metadata)) return 'invalid';
  if (metadata.latestVersionCode <= installedCode) return 'current';
  return metadata.mandatory || installedCode < (metadata.minimumSupportedVersionCode || 0) ? 'mandatory' : 'available';
}

async function fetchUpdateMetadata(request) {
  try {
    const metadata = await request();
    return isValidUpdateMetadata(metadata) ? metadata : null;
  } catch {
    return null;
  }
}

function isCompleteApkDownload(result, fileInfo) {
  if (!result || result.status !== 200 || typeof result.uri !== 'string' || !fileInfo?.exists || fileInfo.isDirectory || fileInfo.size < 1024 * 1024) return false;
  const contentType = Object.entries(result.headers || {}).find(([name]) => name.toLowerCase() === 'content-type')?.[1];
  return typeof contentType !== 'string' || !/^(text\/html|application\/json)(?:\s*;|$)/i.test(contentType);
}

module.exports = { decideUpdate, isValidUpdateMetadata, fetchUpdateMetadata, isCompleteApkDownload };
