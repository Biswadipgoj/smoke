// src/hooks/useAsyncData.ts
// Screens read from SQLite, which is async, and they need to be current when
// the user comes back from logging something. This runs the loader on focus
// and hands back a `reload` for in-screen mutations.

import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = []
): { data: T | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      let cancelled = false;
      setLoading(true);
      run()
        .then((value) => {
          if (!cancelled && mounted.current) setData(value);
        })
        .catch(() => {
          // A read failure leaves the previous value on screen rather than
          // blanking it — stale data beats an empty dashboard mid-craving.
        })
        .finally(() => {
          if (!cancelled && mounted.current) setLoading(false);
        });
      return () => {
        cancelled = true;
        mounted.current = false;
      };
    }, [run])
  );

  const reload = useCallback(() => {
    run()
      .then((value) => {
        if (mounted.current) setData(value);
      })
      .catch(() => {});
  }, [run]);

  return { data, loading, reload };
}
