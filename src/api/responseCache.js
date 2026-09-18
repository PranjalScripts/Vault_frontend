// Session-scoped cache: no credentials or decrypted data are persisted to disk.
export function installResponseCache(api, getAdapter, { ttl = 600000, maxEntries = 250, now = Date.now } = {}) {
  const entries = new Map();
  const pending = new Map();
  let generation = 0;
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const stable = value => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
    return value;
  };
  const clear = (url) => {
    generation++;
    pending.clear();
    if (!url) entries.clear();
    else for (const [key, entry] of entries) if (entry.url === url || entry.url.startsWith(`${url}/`) || entry.url.startsWith(`${url}?`)) entries.delete(key);
  };
  const isWrite = config => ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase());
  api.interceptors.request.use(config => {
    if (isWrite(config)) { clear(); return config; }
    if (config.method?.toLowerCase() !== 'get' || config.__reminderSync || config.cache === false || config.responseType && config.responseType !== 'json' || /^\/auth(?:\/|$)/.test(config.url || '')) return config;
    const key = JSON.stringify([config.baseURL, config.url, stable(config.params), config.headers?.toJSON?.() || config.headers]);
    const adapter = getAdapter(config.adapter || api.defaults.adapter);
    const requestGeneration = generation;
    config.adapter = async request => {
      const cached = entries.get(key);
      if (!config.__forceRefresh && cached && now() - cached.timestamp < ttl) {
        entries.delete(key); entries.set(key, cached);
        return { ...cached.response, data: clone(cached.response.data), config: request, request: null };
      }
      entries.delete(key);
      // Abortable searches remain independent so cancelling one cannot cancel another.
      const share = !request.signal && !request.cancelToken && !config.__forceRefresh;
      let operation = share ? pending.get(key) : undefined;
      if (!operation) {
        operation = Promise.resolve().then(() => adapter(request)).then(response => {
          if (response.status >= 200 && response.status < 300 && generation === requestGeneration) {
            entries.set(key, { url: config.url || '', timestamp: now(), response: { data: clone(response.data), status: response.status, statusText: response.statusText, headers: { ...response.headers } } });
            while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
          }
          return response;
        });
        if (share) pending.set(key, operation);
      }
      try {
        const response = await operation;
        return { ...response, data: clone(response.data), config: request };
      } finally { if (pending.get(key) === operation) pending.delete(key); }
    };
    return config;
  });
  api.interceptors.response.use(response => { if (isWrite(response.config)) clear(); return response; }, error => { if (isWrite(error.config || {})) clear(); return Promise.reject(error); });
  return { clear };
}
