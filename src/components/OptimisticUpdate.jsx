import { useState, useCallback } from 'react';

export default function OptimisticUpdate({ initialData, updateFn, render }) {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const optimisticUpdate = useCallback(async (optimisticData, asyncFn) => {
    const previousData = data;
    setData(prev => typeof optimisticData === 'function' ? optimisticData(prev) : optimisticData);
    setPending(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (result !== undefined) setData(result);
    } catch (err) {
      setData(previousData);
      setError(err.message || 'Ошибка обновления');
    } finally {
      setPending(false);
    }
  }, [data]);

  return (
    <div className="relative">
      {render({ data, setData, optimisticUpdate, pending, error })}
      {pending && (
        <div className="absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export function useOptimistic(initialState) {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);

  const update = useCallback(async (optimistic, asyncFn) => {
    const prev = state;
    setState(typeof optimistic === 'function' ? optimistic(state) : optimistic);
    setPending(true);
    try {
      const result = await asyncFn();
      if (result !== undefined) setState(result);
      return result;
    } catch (err) {
      setState(prev);
      throw err;
    } finally {
      setPending(false);
    }
  }, [state]);

  return { state, setState, update, pending };
}
