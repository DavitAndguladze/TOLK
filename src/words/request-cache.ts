/** Per-process, bounded reuse of provider successes; pending calls share the same promise. */
export function cacheSuccessful<T>(limit: number, keep: (value: T) => boolean = () => true) {
  const entries = new Map<string, Promise<T>>();
  return (key: string, load: () => Promise<T>): Promise<T> => {
    const existing = entries.get(key);
    if (existing) return existing;
    const pending = Promise.resolve().then(load);
    entries.set(key, pending);
    if (entries.size > limit) entries.delete(entries.keys().next().value!);
    const remove = () => { if (entries.get(key) === pending) entries.delete(key); };
    void pending.then((value) => { if (!keep(value)) remove(); }, remove);
    return pending;
  };
}
