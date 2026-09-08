import { ref, watch } from 'vue';
import type { Ref } from 'vue';

export function useLocalStoragePref<T>(key: string, defaultValue: T): Ref<T> {
  const stored = localStorage.getItem(key);
  const initial = stored !== null ? (JSON.parse(stored) as T) : defaultValue;
  const pref = ref(initial) as Ref<T>;

  watch(pref, (value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return pref;
}
