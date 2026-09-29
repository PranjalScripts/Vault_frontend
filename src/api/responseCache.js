// Session-scoped cache: no credentials or decrypted data are persisted to disk.
export function installResponseCache(api, getAdapter, { ttl = 600000, maxEntries = 250, now = Date.now } = {}) {
  const entries = new Map();
  const pending = new Map();
  let generation = 0;
  const versions = new Map();
  const domain = url => (url || '').split(/[/?]/).filter(Boolean)[0] || '';
  const matches = (value, url) => value === url || value.startsWith(`${url}/`) || value.startsWith(`${url}?`);
  const dependencies = {
    todos: ['/todos', '/search', '/trash', '/notifications'],
    subjects: ['/subjects', '/search', '/trash', '/notifications'],
    passcodes: ['/passcodes', '/search', '/trash'],
    interview: ['/interview', '/notifications'],
    notifications: ['/notifications'],
    trash: ['/trash', '/todos', '/subjects', '/passcodes', '/search', '/notifications'],
  };
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const stable = value => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
    return value;
  };
  const clear = (url) => {
    if (!url) { generation++; entries.clear(); pending.clear(); versions.clear(); return; }
    const resource = domain(url);
    versions.set(resource, (versions.get(resource) || 0) + 1);
    for (const [key, entry] of entries) if (matches(entry.url, url)) entries.delete(key);
    for (const [key, entry] of pending) if (matches(entry.url, url)) pending.delete(key);
  };
  const invalidateWrite = config => {
    const resource = domain(config.url);
    const urls = Object.hasOwn(dependencies, resource) ? dependencies[resource] : null;
    if (urls) urls.forEach(clear);
    else clear(); // Authentication, vault changes and unknown writes invalidate the session cache.
  };
  const isWrite = config => ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase());
  api.interceptors.request.use(config => {
    if (isWrite(config)) {
      invalidateWrite(config);
      return config;
    }
    if (config.method?.toLowerCase() !== 'get' || config.__reminderSync || config.cache === false || config.responseType && config.responseType !== 'json' || /^\/auth(?:\/|$)/.test(config.url || '')) return config;
    const key = JSON.stringify([config.baseURL, config.url, stable(config.params), config.headers?.toJSON?.() || config.headers]);
    const adapter = getAdapter(config.adapter || api.defaults.adapter);
    const requestGeneration = generation;
    const resource = domain(config.url), requestVersion = versions.get(resource) || 0;
    config.adapter = async request => {
      const cached = entries.get(key);
      if (!config.__forceRefresh && cached && now() - cached.timestamp < ttl) {
        entries.delete(key); entries.set(key, cached);
        return { ...cached.response, data: clone(cached.response.data), config: request, request: null };
      }
      entries.delete(key);
      // Abortable searches remain independent so cancelling one cannot cancel another.
      const share = !request.signal && !request.cancelToken && !config.__forceRefresh;
      let operation = share ? pending.get(key)?.operation : undefined;
      if (!operation) {
        operation = Promise.resolve().then(() => adapter(request)).then(response => {
          if (response.status >= 200 && response.status < 300 && generation === requestGeneration && (versions.get(resource) || 0) === requestVersion) {
            entries.set(key, { url: config.url || '', timestamp: now(), response: { data: clone(response.data), status: response.status, statusText: response.statusText, headers: { ...response.headers } } });
            while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
          }
          return response;
        });
        if (share) pending.set(key, { operation, url: config.url || '' });
      }
      try {
        const response = await operation;
        return { ...response, data: clone(response.data), config: request };
      } finally { if (pending.get(key)?.operation === operation) pending.delete(key); }
    };
    return config;
  });
  api.interceptors.response.use(response => { if (isWrite(response.config)) invalidateWrite(response.config); return response; }, error => { if (isWrite(error.config || {})) invalidateWrite(error.config); return Promise.reject(error); });
  return { clear };
}
