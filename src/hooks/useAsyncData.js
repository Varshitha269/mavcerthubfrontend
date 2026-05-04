import { useCallback, useEffect, useState } from "react";

/** Loads async data with loading + error flags (used across dashboard pages). */
export function useAsyncData(loadFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loadFn();
      setData(res);
      return res;
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Request failed");
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
