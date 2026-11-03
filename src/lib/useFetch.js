import { useCallback, useEffect, useRef, useState } from 'react';
import { api, parseError } from '../api/client.js';

export function useFetch(url, params, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const key = JSON.stringify([url, params]);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    const n = ++seq.current;
    setLoading(true); setError('');
    try {
      const r = await api.get(url, { params });
      if (n === seq.current) setData(r.data);
    } catch (e) {
      if (n === seq.current) setError(parseError(e).message);
    } finally {
      if (n === seq.current) setLoading(false);
    }
  }, [key, enabled]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
