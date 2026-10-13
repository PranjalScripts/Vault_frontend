export function isValidUpdateMetadata(value: unknown): boolean;
export function decideUpdate(installedCode: number, metadata: unknown): 'invalid' | 'current' | 'available' | 'mandatory';
export function fetchUpdateMetadata(request: () => Promise<unknown>): Promise<Record<string, unknown> | null>;
export function isCompleteApkDownload(result: unknown, fileInfo: unknown): boolean;
